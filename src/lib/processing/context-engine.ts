/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Context Engine
 * 
 * Orchestrates the complete document processing pipeline:
 * 1. Fetch document from Storage
 * 2. Extract text from file
 * 3. Normalize extracted text
 * 4. Extract structured context via AI
 * 5. Validate context
 * 6. Store in document_contexts
 * 
 * Features:
 * - Idempotent processing (checks existing context)
 * - Retry logic (bounded, max 3 retries)
 * - Provenance tracking (document_id, model_version)
 * - Failure handling (transient vs permanent)
 * - Vercel-compatible (no persistent state)
 * 
 * @module processing/context-engine
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { extractText, ExtractionError, isExtractionSufficient } from './extraction';
import { normalizeText, calculateStatistics } from './normalization';
import { extractContext, AIExtractionConfig, AIExtractionError, getRecommendedProvider } from './ai-provider';

/**
 * Processing result
 */
export interface ProcessingResult {
  success: boolean;
  contextId?: string;
  error?: string;
  category?: 'TRANSIENT' | 'PERMANENT';
  canRetry: boolean;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  /**
   * Force reprocessing even if context exists
   * @default false
   */
  force?: boolean;

  /**
   * AI provider configuration
   * @default { provider: auto-detected }
   */
  aiConfig?: AIExtractionConfig;

  /**
   * Skip AI extraction (only extract/normalize text)
   * @default false
   */
  skipAI?: boolean;
}

/**
 * Maximum retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Process a document to extract context
 * 
 * This is the main entry point for document processing.
 * Handles the complete pipeline with idempotency, retry logic, and error handling.
 * 
 * @param documentId Document UUID
 * @param options Processing options
 * @returns Processing result
 */
export async function processDocument(
  documentId: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const adminSupabase = createAdminClient();
  let versionId: string | null = null;  // Track version ID for error handling

  try {
    // Step 1: Check if processing is needed (idempotency)
    if (!options.force) {
      const existingContext = await getExistingContext(documentId);
      
      if (existingContext) {
        // Already processed successfully
        if (existingContext.processing_status === 'COMPLETED') {
          return {
            success: true,
            contextId: existingContext.id,
            error: 'Already processed',
            canRetry: false,
          };
        }

        // Check if retry limit exceeded
        if (existingContext.retry_count >= MAX_RETRIES) {
          return {
            success: false,
            error: 'Maximum retry attempts exceeded',
            category: 'PERMANENT',
            canRetry: false,
          };
        }

        // Check if currently processing (prevent concurrent processing)
        if (existingContext.processing_status === 'PROCESSING') {
          const startedAt = existingContext.started_at ? new Date(existingContext.started_at) : null;
          const now = new Date();
          
          // If processing started > 10 minutes ago, consider it stale
          if (startedAt && (now.getTime() - startedAt.getTime()) > 10 * 60 * 1000) {
            console.warn('[PROCESSING_TIMEOUT]', { documentId, startedAt });
            // Will retry below
          } else {
            return {
              success: false,
              error: 'Document is currently being processed',
              category: 'TRANSIENT',
              canRetry: true,
            };
          }
        }
      }
    }

    // Step 2: Get document and latest version
    const { data: document, error: docError } = await adminSupabase
      .from('documents')
      .select(`
        id,
        institution_id,
        title,
        document_type,
        document_versions!inner(
          id,
          version_number,
          storage_path,
          file_size_bytes,
          created_at
        )
      `)
      .eq('id', documentId)
      .single();

    // Log detailed error for debugging
    if (docError) {
      console.error('[PROCESS_DOCUMENT_QUERY_ERROR]', {
        documentId,
        error: docError.message,
        code: docError.code,
        details: docError.details,
      });
    }

    if (docError || !document) {
      return {
        success: false,
        error: docError ? `Database error: ${docError.message}` : 'Document not found',
        category: 'PERMANENT',
        canRetry: false,
      };
    }

    const versions = Array.isArray((document as any).document_versions) 
      ? (document as any).document_versions 
      : [(document as any).document_versions];
    
    // Sort by version_number descending to get latest
    versions.sort((a: any, b: any) => (b.version_number || 0) - (a.version_number || 0));
    
    const latestVersion = versions[0];
    versionId = latestVersion?.id || null;  // Store for error handling

    if (!latestVersion || !latestVersion.storage_path) {
      return {
        success: false,
        error: 'No document version with storage path found',
        category: 'PERMANENT',
        canRetry: false,
      };
    }

    // Step 3: Mark processing as started (using version ID for proper tracking)
    await markProcessingStarted(documentId, latestVersion.id);

    // Step 4: Download file from Storage
    const { data: fileData, error: downloadError } = await adminSupabase
      .storage
      .from('institutional-documents')
      .download(latestVersion.storage_path);

    if (downloadError || !fileData) {
      await markProcessingFailed(
        documentId,
        latestVersion.id,
        'Failed to download file from storage',
        'TRANSIENT'
      );
      return {
        success: false,
        error: 'Failed to download file',
        category: 'TRANSIENT',
        canRetry: true,
      };
    }

    // Step 5: Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 6: Detect MIME type (fallback from document type or file extension)
    const mimeType = detectMimeType((document as any).document_type, latestVersion.storage_path);

    // Step 7: Extract text
    let extractionResult;
    try {
      extractionResult = await extractText(buffer, mimeType);
    } catch (error) {
      if (error instanceof ExtractionError) {
        const category = error.category === 'UNSUPPORTED' || error.category === 'CORRUPT' 
          ? 'PERMANENT' 
          : 'TRANSIENT';
        
        await markProcessingFailed(documentId, latestVersion.id, error.message, category);
        
        return {
          success: false,
          error: error.message,
          category,
          canRetry: category === 'TRANSIENT',
        };
      }
      throw error;
    }

    // Step 8: Check if extraction is sufficient
    if (!isExtractionSufficient(extractionResult)) {
      const errorMessage = extractionResult.metadata.isImageOnly
        ? 'Image-only PDF detected. OCR not yet implemented.'
        : 'Insufficient text extracted (< 10 words)';

      await markProcessingFailed(documentId, latestVersion.id, errorMessage, 'PERMANENT');

      return {
        success: false,
        error: errorMessage,
        category: 'PERMANENT',
        canRetry: false,
      };
    }

    // Step 9: Normalize text
    const normalizedText = normalizeText(extractionResult.text);
    const stats = calculateStatistics(normalizedText);

    // Step 10: Extract structured context via AI (if not skipped)
    let aiResult = null;
    if (!options.skipAI) {
      const aiConfig = options.aiConfig || {
        provider: getRecommendedProvider(),
      };

      try {
        aiResult = await extractContext(normalizedText, aiConfig);
      } catch (error) {
        if (error instanceof AIExtractionError) {
          const category = error.category === 'RATE_LIMIT' || error.category === 'PROVIDER_ERROR'
            ? 'TRANSIENT'
            : 'PERMANENT';

          await markProcessingFailed(documentId, latestVersion.id, error.message, category);

          return {
            success: false,
            error: error.message,
            category,
            canRetry: category === 'TRANSIENT',
          };
        }
        throw error;
      }
    }

    // Step 11: Store context in database (with version ID for proper provenance)
    const contextId = await storeContext(
      documentId,
      latestVersion.id,
      extractionResult.text,
      normalizedText,
      aiResult,
      stats
    );

    // Step 12: Mark processing as completed
    await markProcessingCompleted(documentId, latestVersion.id);

    return {
      success: true,
      contextId,
      canRetry: false,
    };

  } catch (error) {
    console.error('[PROCESS_DOCUMENT_ERROR]', { documentId, versionId, error });
    
    // Only mark as failed if we have a version ID
    if (versionId) {
      await markProcessingFailed(
        documentId,
        versionId,
        error instanceof Error ? error.message : 'Unknown error',
        'TRANSIENT'
      );
    }

    return {
      success: false,
      error: 'Processing failed with unexpected error',
      category: 'TRANSIENT',
      canRetry: true,
    };
  }
}

/**
 * Get existing context for document
 */
async function getExistingContext(documentId: string): Promise<any> {
  const adminSupabase = createAdminClient();

  const { data } = await adminSupabase
    .from('document_contexts')
    .select('id, processing_status, retry_count, started_at')
    .eq('document_id', documentId)
    .single();

  return data;
}

/**
 * Mark processing as started
 */
async function markProcessingStarted(documentId: string, versionId: string): Promise<void> {
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from('document_contexts')
    .upsert({
      document_id: documentId,
      document_version_id: versionId,
      processing_status: 'PROCESSING',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any, {
      onConflict: 'document_version_id',
    });
}

/**
 * Mark processing as failed and increment retry count
 */
async function markProcessingFailed(
  documentId: string,
  versionId: string,
  errorMessage: string,
  category: 'TRANSIENT' | 'PERMANENT'
): Promise<void> {
  const adminSupabase = createAdminClient();

  const existing = await getExistingContext(documentId);
  const retryCount = (existing?.retry_count || 0) + 1;

  await adminSupabase
    .from('document_contexts')
    .upsert({
      document_id: documentId,
      document_version_id: versionId,
      processing_status: 'FAILED',
      error_message: errorMessage,
      retry_count: retryCount,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any, {
      onConflict: 'document_version_id',
    });

  console.error('[PROCESSING_FAILED]', {
    documentId,
    versionId,
    errorMessage,
    category,
    retryCount,
  });
}

/**
 * Mark processing as completed
 */
async function markProcessingCompleted(_documentId: string, versionId: string): Promise<void> {
  const adminSupabase = createAdminClient();

  await (adminSupabase as any)
    .from('document_contexts')
    .update({
      processing_status: 'COMPLETED',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('document_version_id', versionId);
}

/**
 * Store extracted context in database
 */
async function storeContext(
  documentId: string,
  versionId: string,
  extractedText: string,
  normalizedText: string,
  aiResult: Awaited<ReturnType<typeof extractContext>> | null,
  stats: ReturnType<typeof calculateStatistics>
): Promise<string> {
  const adminSupabase = createAdminClient();

  const contextData = {
    document_id: documentId,
    document_version_id: versionId,  // CRITICAL: Per-version context storage
    extracted_text: extractedText,
    normalized_text: normalizedText,
    document_type_detected: aiResult?.context.document_type_detected || null,
    creator_role_detected: aiResult?.context.creator_role_detected || null,
    department_scope: aiResult?.context.department_scope || null,
    purpose: aiResult?.context.purpose || null,
    impact_level: aiResult?.context.impact_level || null,
    extracted_attributes: {
      ...aiResult?.context.extracted_attributes,
      statistics: stats,
      extraction_metadata: aiResult ? {
        model: aiResult.metadata.model,
        provider: aiResult.metadata.provider,
        prompt_version: aiResult.metadata.promptVersion,
      } : null,
    },
    confidence_score: aiResult?.context.confidence_score || null,
    model_version: aiResult ? `${aiResult.metadata.provider}:${aiResult.metadata.model}` : null,
    processing_status: 'COMPLETED',
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminSupabase
    .from('document_contexts')
    .upsert(contextData as any, {
      onConflict: 'document_version_id',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store context: ${error.message}`);
  }

  return (data as any).id;
}

/**
 * Detect MIME type from document type or file extension
 */
function detectMimeType(_documentType: string | null, storagePath: string): string {
  // Try from storage path extension
  const ext = storagePath.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'txt':
      return 'text/plain';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Retry processing for failed documents
 * 
 * @param documentId Document UUID
 * @returns Processing result
 */
export async function retryProcessing(documentId: string): Promise<ProcessingResult> {
  const existing = await getExistingContext(documentId);

  if (!existing) {
    return {
      success: false,
      error: 'No existing context found',
      category: 'PERMANENT',
      canRetry: false,
    };
  }

  if (existing.retry_count >= MAX_RETRIES) {
    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
      category: 'PERMANENT',
      canRetry: false,
    };
  }

  // Force reprocessing
  return processDocument(documentId, { force: true });
}

/**
 * Get processing status for a document
 * 
 * @param documentId Document UUID
 * @returns Processing status and metadata
 */
export async function getProcessingStatus(documentId: string) {
  const serverSupabase = await createServerClient();

  const { data, error } = await serverSupabase
    .from('document_contexts')
    .select(`
      id,
      processing_status,
      retry_count,
      error_message,
      started_at,
      processed_at,
      confidence_score,
      model_version
    `)
    .eq('document_id', documentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
