/**
 * Document Storage Utilities
 * 
 * Handles Supabase Storage operations for documents.
 * 
 * Security:
 * - Generates deterministic storage paths
 * - Enforces tenant boundaries
 * - Uses signed URLs for protected access
 * - Never exposes storage credentials to browser
 */

import { sanitizeFilename } from './validation';

// =====================================================
// STORAGE CONFIGURATION
// =====================================================

export const STORAGE_BUCKET = 'institutional-documents';
export const SIGNED_URL_EXPIRY_SECONDS = 60; // 60 seconds

// =====================================================
// STORAGE PATH GENERATION
// =====================================================

/**
 * Generate storage path for document version
 * 
 * Path format: {institution_id}/documents/{document_id}/versions/{version_number}/{safe_filename}
 * 
 * Security:
 * - Institution ID from authenticated session (server-side only)
 * - Document ID from database UUID (not user input)
 * - Version number from database (enforced by unique constraint)
 * - Filename sanitized (no path traversal)
 * 
 * @param institutionId Institution UUID
 * @param documentId Document UUID
 * @param versionNumber Version number (1, 2, 3...)
 * @param originalFilename Original filename
 * @returns Safe storage path
 */
export function generateStoragePath(
  institutionId: string,
  documentId: string,
  versionNumber: number,
  originalFilename: string
): string {
  // Validate inputs
  if (!institutionId || !documentId || !versionNumber || !originalFilename) {
    throw new Error('All path components are required');
  }

  if (versionNumber < 1) {
    throw new Error('Version number must be >= 1');
  }

  // Sanitize filename
  const safeFilename = sanitizeFilename(originalFilename);

  // Generate deterministic path
  // Format: {institution_id}/documents/{document_id}/versions/{version_number}/{safe_filename}
  return `${institutionId}/documents/${documentId}/versions/${versionNumber}/${safeFilename}`;
}

/**
 * Parse institution ID from storage path
 * 
 * Used by storage policies to enforce tenant isolation.
 * 
 * @param storagePath Full storage path
 * @returns Institution ID or null
 */
export function parseInstitutionIdFromPath(storagePath: string): string | null {
  const parts = storagePath.split('/');
  return parts.length > 0 && parts[0] ? parts[0] : null;
}

/**
 * Parse document ID from storage path
 * 
 * @param storagePath Full storage path
 * @returns Document ID or null
 */
export function parseDocumentIdFromPath(storagePath: string): string | null {
  const parts = storagePath.split('/');
  // Path format: {institution_id}/documents/{document_id}/versions/{version_number}/{filename}
  return parts.length >= 3 && parts[2] ? parts[2] : null;
}

/**
 * Parse version number from storage path
 * 
 * @param storagePath Full storage path
 * @returns Version number or null
 */
export function parseVersionNumberFromPath(storagePath: string): number | null {
  const parts = storagePath.split('/');
  // Path format: {institution_id}/documents/{document_id}/versions/{version_number}/{filename}
  if (parts.length >= 5 && parts[4]) {
    const versionNum = parseInt(parts[4], 10);
    return isNaN(versionNum) ? null : versionNum;
  }
  return null;
}

/**
 * Extract original filename from storage path
 * 
 * @param storagePath Full storage path
 * @returns Filename or null
 */
export function extractFilenameFromPath(storagePath: string): string | null {
  const parts = storagePath.split('/');
  const lastPart = parts[parts.length - 1];
  return parts.length > 0 && lastPart ? lastPart : null;
}

// =====================================================
// FILE SIZE FORMATTING
// =====================================================

/**
 * Format bytes to human-readable size
 * 
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// =====================================================
// CONTENT TYPE DETECTION
// =====================================================

/**
 * Get content type from filename extension
 * 
 * Used for setting proper Content-Type headers when serving files.
 * 
 * @param filename Filename with extension
 * @returns Content-Type or application/octet-stream
 */
export function getContentTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    txt: 'text/plain',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

// =====================================================
// STORAGE ERROR HANDLING
// =====================================================

export interface StorageError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Format storage error for user display
 * 
 * Security: Never expose internal error details or storage paths
 * 
 * @param error Raw error from Supabase Storage
 * @returns User-friendly error message
 */
export function formatStorageError(error: unknown): string {
  // Type guard for error objects
  const err = error as { message?: string; statusCode?: number; status?: number } | null;
  // Generic error messages - do not expose internal details
  if (err?.message?.includes('new row violates row-level security')) {
    return 'You do not have permission to perform this operation';
  }

  if (err?.message?.includes('duplicate key')) {
    return 'A version with this number already exists';
  }

  if (err?.statusCode === 404 || err?.status === 404) {
    return 'Document not found';
  }

  if (err?.statusCode === 403 || err?.status === 403) {
    return 'Access denied';
  }

  if (err?.message?.includes('size')) {
    return 'File size exceeds maximum allowed';
  }

  if (err?.message?.includes('type')) {
    return 'File type not allowed';
  }

  // Generic fallback
  return 'An error occurred while processing your request';
}

// =====================================================
// LOGGING UTILITIES
// =====================================================

/**
 * Log orphaned storage file for cleanup
 * 
 * When storage upload succeeds but database insert fails,
 * log the orphaned file path for future cleanup.
 * 
 * @param storagePath Path to orphaned file
 * @param context Additional context
 */
export function logOrphanedFile(storagePath: string, context: Record<string, unknown>): void {
  // In production, this should write to a proper logging system
  // For now, use console with structured data
  console.warn('[ORPHANED_FILE]', {
    storagePath,
    timestamp: new Date().toISOString(),
    ...context,
  });

  // TODO: Implement proper orphan tracking
  // - Write to database table for cleanup job
  // - Or write to external logging service
  // - Scheduled job should cleanup files older than 24 hours
}
