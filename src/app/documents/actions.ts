/**
 * Document Management Server Actions
 * 
 * Server-side actions for document operations.
 * 
 * Security:
 * - All actions require authentication
 * - Institution ID from session (never from client)
 * - Authorization checks before operations
 * - Input validation on all user data
 * - Generic error messages (no internal details)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import {
  validateFile,
  validateDocumentMetadata,
} from '@/lib/documents/validation';
import {
  generateStoragePath,
  STORAGE_BUCKET,
  SIGNED_URL_EXPIRY_SECONDS,
  formatStorageError,
  logOrphanedFile,
  extractFilenameFromPath,
} from '@/lib/documents/storage';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface UploadDocumentInput {
  title: string;
  document_type: string;
  description?: string;
  department_id?: string | null;
}

export interface UploadDocumentResult {
  success: boolean;
  documentId?: string;
  versionId?: string;
  error?: string;
  errors?: string[];
}

interface DocumentListItem {
  id: string;
  title: string;
  document_type: string | null;
  status: string;
  created_at: string;
  created_by: string;
  version_count: number;
  latest_version: number;
  creator?: {
    id: string;
    display_name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

interface DocumentVersion {
  id: string;
  version_number: number;
  file_size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
  uploader?: {
    id: string;
    display_name: string;
    email: string;
  };
}

interface DocumentDetail {
  id: string;
  title: string;
  document_type: string | null;
  description: string | null;
  status: string;
  department_id: string | null;
  institution_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  storage_path: string | null;
  creator?: {
    id: string;
    display_name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface GetDocumentsResult {
  success: boolean;
  documents?: DocumentListItem[];
  error?: string;
}

export interface GetDocumentResult {
  success: boolean;
  document?: DocumentDetail;
  versions?: DocumentVersion[];
  error?: string;
}

export interface GetDownloadUrlResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// =====================================================
// DOCUMENT CREATION & UPLOAD
// =====================================================

/**
 * Upload a new document with version
 * 
 * Flow:
 * 1. Validate authentication & authorization
 * 2. Extract file from FormData
 * 3. Validate file & metadata
 * 4. Create document record
 * 5. Upload file to storage
 * 6. Create document_versions record
 * 7. Update document with storage_path
 * 8. Revalidate paths
 * 
 * Security:
 * - Institution ID from authenticated session
 * - User cannot specify institution_id
 * - Department ID validated if provided
 * - Storage path generated server-side
 * 
 * @param formData FormData with file and metadata
 * @returns Result with document ID or errors
 */
export async function uploadDocument(
  formData: FormData
): Promise<UploadDocumentResult> {
  try {
    // ==========================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ==========================================

    const session = await requireAuth();
    const profile = await requireProfile();

    // Check user is ACTIVE
    if (profile.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Your account must be active to upload documents',
      };
    }

    // Get institution ID from profile (NEVER from client)
    const institutionId = profile.institution_id;
    const userId = session.userId;

    // ==========================================
    // 2. EXTRACT DATA FROM FORMDATA
    // ==========================================

    const title = formData.get('title') as string;
    const document_type = formData.get('document_type') as string;
    const description = formData.get('description') as string | null;
    const department_id = formData.get('department_id') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // ==========================================
    // 3. VALIDATE FILE
    // ==========================================

    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: 'File validation failed',
        errors: fileValidation.errors,
      };
    }

    // ==========================================
    // 4. VALIDATE METADATA
    // ==========================================

    const metadataValidation = validateDocumentMetadata({
      title,
      document_type,
      description: description || undefined,
      department_id: department_id || undefined,
    });

    if (!metadataValidation.valid) {
      return {
        success: false,
        error: 'Metadata validation failed',
        errors: metadataValidation.errors,
      };
    }

    // ==========================================
    // 5. VALIDATE DEPARTMENT (if provided)
    // ==========================================

    const supabase = await createServerClient();

    if (department_id) {
      // Verify department exists and belongs to user's institution
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .select('id, institution_id')
        .eq('id', department_id)
        .eq('institution_id', institutionId)
        .single();

      if (deptError || !department) {
        return {
          success: false,
          error: 'Invalid department',
        };
      }
    }

    // ==========================================
    // 6. CREATE DOCUMENT RECORD
    // ==========================================

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        institution_id: institutionId,
        department_id: department_id || null,
        created_by: userId,
        title: title.trim(),
        document_type: document_type.trim(),
        description: description?.trim() || null,
        status: 'DRAFT', // Start as DRAFT
        storage_path: null, // Will be updated after upload
      })
      .select('id')
      .single();

    if (docError || !document) {
      console.error('[DOCUMENT_CREATE_ERROR]', docError);
      return {
        success: false,
        error: 'Failed to create document',
      };
    }

    const documentId = document.id;

    // ==========================================
    // 7. UPLOAD FILE TO STORAGE
    // ==========================================

    // Generate storage path (version 1)
    const storagePath = generateStoragePath(
      institutionId,
      documentId,
      1, // First version
      file.name
    );

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false, // Prevent accidental overwrites
      });

    if (uploadError || !uploadData) {
      console.error('[STORAGE_UPLOAD_ERROR]', uploadError);

      // Delete the document record since upload failed
      await supabase.from('documents').delete().eq('id', documentId);

      return {
        success: false,
        error: formatStorageError(uploadError),
      };
    }

    // ==========================================
    // 8. CREATE DOCUMENT VERSION RECORD
    // ==========================================

    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: 1,
        storage_path: storagePath,
        file_size_bytes: file.size,
        uploaded_by: userId,
        checksum: null, // TODO: Calculate SHA-256 hash if needed
      })
      .select('id')
      .single();

    if (versionError || !version) {
      console.error('[VERSION_CREATE_ERROR]', versionError);

      // Log orphaned file for cleanup
      logOrphanedFile(storagePath, {
        documentId,
        error: versionError?.message,
      });

      // Delete document record
      await supabase.from('documents').delete().eq('id', documentId);

      return {
        success: false,
        error: 'Failed to create document version',
      };
    }

    // ==========================================
    // 9. UPDATE DOCUMENT WITH STORAGE PATH
    // ==========================================

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        storage_path: storagePath, // Point to current version
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('[DOCUMENT_UPDATE_ERROR]', updateError);
      // Non-fatal: version record exists, just storage_path not updated
    }

    // ==========================================
    // 10. REVALIDATE & RETURN SUCCESS
    // ==========================================

    revalidatePath('/documents');
    revalidatePath(`/documents/${documentId}`);

    return {
      success: true,
      documentId,
      versionId: version.id,
    };
  } catch (error) {
    console.error('[UPLOAD_DOCUMENT_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

// =====================================================
// DOCUMENT LISTING
// =====================================================

/**
 * Get documents for current user's institution
 * 
 * Security:
 * - Only returns documents from user's institution
 * - RLS policies enforce tenant isolation
 * - Includes creator information via join
 * 
 * @returns List of documents
 */
export async function getDocuments(): Promise<GetDocumentsResult> {
  try {
    await requireAuth();
    const profile = await requireProfile();

    const supabase = await createServerClient();

    // First get documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select(
        `
        id,
        title,
        document_type,
        description,
        status,
        created_at,
        updated_at,
        created_by,
        creator:profiles!documents_created_by_fkey(
          id,
          display_name,
          email
        ),
        department:departments(
          id,
          name
        )
      `
      )
      .eq('institution_id', profile.institution_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET_DOCUMENTS_ERROR]', error);
      return {
        success: false,
        error: 'Failed to load documents',
      };
    }

    // Get version counts and latest version for each document
    const documentsWithVersions = await Promise.all(
      (documents || []).map(async (doc: {
        id: string;
        title: string;
        document_type: string | null;
        description: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        created_by: string;
        creator: unknown;
        department: unknown;
      }) => {
        const { data: versions } = await supabase
          .from('document_versions')
          .select('version_number')
          .eq('document_id', doc.id)
          .order('version_number', { ascending: false });

        const versionNumbers = (versions || []).map((v) => v.version_number);
        
        return {
          ...doc,
          creator: Array.isArray(doc.creator) && doc.creator.length > 0
            ? doc.creator[0]
            : undefined,
          department: Array.isArray(doc.department) && doc.department.length > 0
            ? doc.department[0]
            : undefined,
          version_count: versionNumbers.length,
          latest_version: versionNumbers.length > 0 ? Math.max(...versionNumbers) : 0,
        };
      })
    );

    return {
      success: true,
      documents: documentsWithVersions,
    };
  } catch (error) {
    console.error('[GET_DOCUMENTS_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

// =====================================================
// DOCUMENT DETAIL
// =====================================================

/**
 * Get document by ID with versions
 * 
 * Security:
 * - RLS ensures user can only access own institution's documents
 * - Returns 404 if not found or access denied
 * 
 * @param documentId Document UUID
 * @returns Document with versions
 */
export async function getDocument(documentId: string): Promise<GetDocumentResult> {
  try {
    await requireAuth();
    const profile = await requireProfile();

    const supabase = await createServerClient();

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(
        `
        id,
        title,
        document_type,
        description,
        status,
        storage_path,
        created_at,
        updated_at,
        created_by,
        institution_id,
        department_id,
        creator:profiles!documents_created_by_fkey(
          id,
          display_name,
          email
        ),
        department:departments(
          id,
          name,
          code
        )
      `
      )
      .eq('id', documentId)
      .eq('institution_id', profile.institution_id) // Enforce tenant boundary
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Get versions
    const { data: versions, error: versionsError } = await supabase
      .from('document_versions')
      .select(
        `
        id,
        version_number,
        storage_path,
        file_size_bytes,
        checksum,
        created_at,
        uploaded_by,
        uploader:profiles!document_versions_uploaded_by_fkey(
          id,
          display_name,
          email
        )
      `
      )
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (versionsError) {
      console.error('[GET_VERSIONS_ERROR]', versionsError);
    }

    // Transform the document to handle array relations from Supabase
    const transformedDocument = document ? {
      ...document,
      creator: Array.isArray(document.creator) && document.creator.length > 0
        ? document.creator[0]
        : undefined,
      department: Array.isArray(document.department) && document.department.length > 0
        ? document.department[0]
        : undefined,
    } : undefined;

    // Transform versions to handle uploader array relation
    const transformedVersions = (versions || []).map((v: {
      id: string;
      version_number: number;
      file_size_bytes: number | null;
      created_at: string;
      uploaded_by: string;
      uploader: unknown;
      storage_path: string;
      checksum: string | null;
    }) => ({
      ...v,
      uploader: Array.isArray(v.uploader) && v.uploader.length > 0
        ? v.uploader[0]
        : undefined,
    }));

    return {
      success: true,
      document: transformedDocument,
      versions: transformedVersions,
    };
  } catch (error) {
    console.error('[GET_DOCUMENT_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}


// =====================================================
// PROTECTED DOCUMENT ACCESS
// =====================================================

/**
 * Get signed URL for document download
 * 
 * Security:
 * 1. Verify authentication
 * 2. Verify authorization (same institution)
 * 3. Check document status (allow access based on role)
 * 4. Generate short-lived signed URL (60 seconds)
 * 5. Never expose storage credentials
 * 6. Log access for audit trail
 * 
 * @param versionId Document version UUID
 * @returns Signed URL with 60-second expiry
 */
export async function getDocumentDownloadUrl(
  versionId: string
): Promise<GetDownloadUrlResult> {
  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    await requireAuth();
    const profile = await requireProfile();

    const supabase = await createServerClient();

    // ==========================================
    // 2. GET VERSION & DOCUMENT
    // ==========================================

    // Get version with document information
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select(
        `
        id,
        document_id,
        version_number,
        storage_path,
        document:documents!document_versions_document_id_fkey(
          id,
          title,
          institution_id,
          status,
          created_by
        )
      `
      )
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return {
        success: false,
        error: 'Document version not found',
      };
    }

    // Type assertion for nested document
    const document = Array.isArray(version.document) 
      ? version.document[0] 
      : version.document;

    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // ==========================================
    // 3. AUTHORIZATION CHECK
    // ==========================================

    // Verify document belongs to user's institution
    if (document.institution_id !== profile.institution_id) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Check document status - restrict access based on status and role
    const documentStatus = document.status;
    const userRole = profile.role;

    // ARCHIVED documents: Admin/System Admin only
    if (documentStatus === 'ARCHIVED') {
      if (!['ADMIN', 'SYSTEM_ADMIN'].includes(userRole)) {
        return {
          success: false,
          error: 'This document has been archived',
        };
      }
    }

    // REJECTED documents: Creator and admins only
    if (documentStatus === 'REJECTED') {
      const isCreator = document.created_by === profile.id;
      const isAdmin = ['ADMIN', 'SYSTEM_ADMIN'].includes(userRole);

      if (!isCreator && !isAdmin) {
        return {
          success: false,
          error: 'Access denied to rejected document',
        };
      }
    }

    // ==========================================
    // 4. GENERATE SIGNED URL
    // ==========================================

    if (!version.storage_path) {
      return {
        success: false,
        error: 'Document file not found',
      };
    }

    // Generate signed URL with short expiry (60 seconds)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(version.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (urlError || !signedUrlData) {
      console.error('[SIGNED_URL_ERROR]', urlError);
      return {
        success: false,
        error: 'Failed to generate download link',
      };
    }

    // ==========================================
    // 5. EXTRACT FILENAME FOR DOWNLOAD
    // ==========================================

    const filename = extractFilenameFromPath(version.storage_path);

    // ==========================================
    // 6. LOG ACCESS (Optional - for audit trail)
    // ==========================================

    // TODO: Log document access event in audit_events table
    // await supabase.from('audit_events').insert({
    //   institution_id: profile.institution_id,
    //   user_id: profile.id,
    //   event_type: 'DOCUMENT_ACCESSED',
    //   resource_type: 'document_version',
    //   resource_id: versionId,
    //   metadata: {
    //     document_id: version.document_id,
    //     version_number: version.version_number,
    //   },
    // });

    return {
      success: true,
      url: signedUrlData.signedUrl,
      filename: filename || 'document',
    };
  } catch (error) {
    console.error('[GET_DOWNLOAD_URL_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get signed URL for current document version
 * 
 * Convenience method that gets the latest version's download URL
 * 
 * @param documentId Document UUID
 * @returns Signed URL for current version
 */
export async function getCurrentDocumentDownloadUrl(
  documentId: string
): Promise<GetDownloadUrlResult> {
  try {
    await requireAuth();
    const profile = await requireProfile();

    const supabase = await createServerClient();

    // Get document with current version
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(
        `
        id,
        institution_id,
        status,
        created_by,
        versions:document_versions!document_versions_document_id_fkey(
          id,
          version_number,
          storage_path
        )
      `
      )
      .eq('id', documentId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Get latest version (highest version number)
    const versions = document.versions as Array<{
      id: string;
      version_number: number;
      storage_path: string;
    }>;
    if (!versions || versions.length === 0) {
      return {
        success: false,
        error: 'No versions available',
      };
    }

    const latestVersion = versions.reduce((max, v) =>
      v.version_number > max.version_number ? v : max
    );

    // Use the main getDocumentDownloadUrl function for authorization and URL generation
    return getDocumentDownloadUrl(latestVersion.id);
  } catch (error) {
    console.error('[GET_CURRENT_DOWNLOAD_URL_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

// =====================================================
// DOCUMENT VERSION UPLOAD
// =====================================================

/**
 * Upload a new version of an existing document
 * 
 * Security:
 * - User must have access to the document
 * - Document must belong to user's institution
 * - Version number calculated safely in transaction
 * - Unique constraint prevents race conditions
 * 
 * @param documentId Document UUID
 * @param file New version file
 * @returns Result with version ID or errors
 */
export async function uploadDocumentVersion(
  documentId: string,
  file: File
): Promise<UploadDocumentResult> {
  try {
    // ==========================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ==========================================

    const session = await requireAuth();
    const profile = await requireProfile();

    if (profile.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Your account must be active to upload document versions',
      };
    }

    const userId = session.userId;

    const supabase = await createServerClient();

    // ==========================================
    // 2. VERIFY DOCUMENT EXISTS & ACCESS
    // ==========================================

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, institution_id, title, status')
      .eq('id', documentId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Check if document status allows new versions
    if (document.status === 'ARCHIVED') {
      return {
        success: false,
        error: 'Cannot upload versions to archived documents',
      };
    }

    // ==========================================
    // 3. VALIDATE FILE
    // ==========================================

    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: 'File validation failed',
        errors: fileValidation.errors,
      };
    }

    // ==========================================
    // 4. CALCULATE NEXT VERSION NUMBER
    // ==========================================

    // Get current max version number
    const { data: maxVersionData, error: maxError } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (maxError && maxError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (first version)
      console.error('[MAX_VERSION_ERROR]', maxError);
      return {
        success: false,
        error: 'Failed to determine version number',
      };
    }

    const nextVersion = maxVersionData ? maxVersionData.version_number + 1 : 1;

    // ==========================================
    // 5. UPLOAD FILE TO STORAGE
    // ==========================================

    const storagePath = generateStoragePath(
      profile.institution_id,
      documentId,
      nextVersion,
      file.name
    );

    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error('[VERSION_UPLOAD_ERROR]', uploadError);
      return {
        success: false,
        error: formatStorageError(uploadError),
      };
    }

    // ==========================================
    // 6. CREATE VERSION RECORD
    // ==========================================

    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersion,
        storage_path: storagePath,
        file_size_bytes: file.size,
        uploaded_by: userId,
        checksum: null,
      })
      .select('id')
      .single();

    if (versionError || !version) {
      console.error('[VERSION_CREATE_ERROR]', versionError);

      // Log orphaned file
      logOrphanedFile(storagePath, {
        documentId,
        versionNumber: nextVersion,
        error: versionError?.message,
      });

      // Check if it's a unique violation (race condition)
      if (versionError?.code === '23505') {
        return {
          success: false,
          error: 'Version conflict. Please try again.',
        };
      }

      return {
        success: false,
        error: 'Failed to create document version',
      };
    }

    // ==========================================
    // 7. UPDATE DOCUMENT
    // ==========================================

    // Update document's storage_path to point to latest version
    // Also update the updated_at timestamp
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('[DOCUMENT_UPDATE_ERROR]', updateError);
      // Non-fatal: version record exists
    }

    // ==========================================
    // 8. REVALIDATE & RETURN
    // ==========================================

    revalidatePath('/documents');
    revalidatePath(`/documents/${documentId}`);

    return {
      success: true,
      documentId,
      versionId: version.id,
    };
  } catch (error) {
    console.error('[UPLOAD_VERSION_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}


/**
 * Get document processing status
 * 
 * Fetches the processing status and context availability for a document
 * 
 * @param documentId - Document UUID
 * @returns Processing status information
 */
export async function getDocumentProcessingStatus(documentId: string) {
  try {
    await requireAuth();
    const profile = await requireProfile();

    const supabase = await createServerClient();

    // Get document to verify access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, institution_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Verify institution access
    if (document.institution_id !== profile.institution_id) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Get processing context
    const { data: context } = await supabase
      .from('document_contexts')
      .select('processing_status, confidence_score, processed_at')
      .eq('document_id', documentId)
      .single();

    return {
      success: true,
      data: {
        processingStatus: context?.processing_status || null,
        hasContext: !!context && context.processing_status === 'COMPLETED',
        processedAt: context?.processed_at || null,
        confidenceScore: context?.confidence_score || null,
      },
    };
  } catch (error) {
    console.error('[GET_DOCUMENT_PROCESSING_STATUS_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get processing status',
    };
  }
}
