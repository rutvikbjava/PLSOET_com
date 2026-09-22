/**
 * Document Processing Server Actions
 * 
 * Handles document processing requests from client:
 * - Trigger processing
 * - Check processing status
 * - Retry failed processing
 * - Get context results
 * 
 * @module app/processing/actions
 */

'use server';

import { requireAuth } from '@/lib/auth/session';
import { processDocument, retryProcessing, getProcessingStatus, type ProcessingResult } from '@/lib/processing';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Trigger processing for a document
 * 
 * @param documentId Document UUID
 * @param options Processing options
 * @returns Processing result
 */
export async function triggerProcessing(
  documentId: string,
  options?: {
    force?: boolean;
    skipAI?: boolean;
  }
): Promise<ProcessingResult> {
  try {
    await requireAuth();

    // Verify user has access to this document (RLS handles institution_id check)
    const supabase = await createServerClient();
    const { data: document, error } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return {
        success: false,
        error: 'Document not found or access denied',
        category: 'PERMANENT',
        canRetry: false,
      };
    }

    // Trigger processing
    return await processDocument(documentId, options);
  } catch (error) {
    console.error('[TRIGGER_PROCESSING_ERROR]', error);
    return {
      success: false,
      error: 'Failed to trigger processing',
      category: 'TRANSIENT',
      canRetry: true,
    };
  }
}

/**
 * Retry processing for a failed document
 * 
 * @param documentId Document UUID
 * @returns Processing result
 */
export async function retryProcessingAction(documentId: string): Promise<ProcessingResult> {
  try {
    await requireAuth();

    // Verify user has access to this document (RLS handles institution_id check)
    const supabase = await createServerClient();
    const { data: document, error } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return {
        success: false,
        error: 'Document not found or access denied',
        category: 'PERMANENT',
        canRetry: false,
      };
    }

    return await retryProcessing(documentId);
  } catch (error) {
    console.error('[RETRY_PROCESSING_ERROR]', error);
    return {
      success: false,
      error: 'Failed to retry processing',
      category: 'TRANSIENT',
      canRetry: true,
    };
  }
}

/**
 * Get processing status for a document
 * 
 * @param documentId Document UUID
 * @returns Processing status and metadata
 */
export async function getProcessingStatusAction(documentId: string) {
  try {
    await requireAuth();

    // Verify user has access to this document (RLS handles institution_id check)
    const supabase = await createServerClient();
    const { data: document, error } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return {
        success: false,
        error: 'Document not found or access denied',
      };
    }

    const status = await getProcessingStatus(documentId);

    return {
      success: true,
      status,
    };
  } catch (error) {
    console.error('[GET_PROCESSING_STATUS_ERROR]', error);
    return {
      success: false,
      error: 'Failed to get processing status',
    };
  }
}

/**
 * Get extracted context for a document
 * 
 * @param documentId Document UUID
 * @returns Document context
 */
export async function getDocumentContext(documentId: string) {
  try {
    await requireAuth();

    const supabase = await createServerClient();

    // Get document with context (RLS handles institution_id check)
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_type,
        status,
        created_at,
        context:document_contexts(
          id,
          document_type_detected,
          creator_role_detected,
          department_scope,
          purpose,
          impact_level,
          extracted_attributes,
          confidence_score,
          model_version,
          processing_status,
          error_message,
          retry_count,
          processed_at
        )
      `)
      .eq('id', documentId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Transform context relation
    const context = Array.isArray(data.context) && data.context.length > 0
      ? data.context[0]
      : null;

    return {
      success: true,
      document: {
        ...data,
        context,
      },
    };
  } catch (error) {
    console.error('[GET_DOCUMENT_CONTEXT_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
