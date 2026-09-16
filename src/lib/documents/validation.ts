/**
 * Document Upload Validation Utilities
 * 
 * Server-side validation for document uploads.
 * Client-side validation is UX only and can be bypassed.
 * 
 * Security:
 * - Validates file size, type, extension
 * - Sanitizes filenames
 * - Prevents path traversal
 * - Enforces allowed file types
 */

// =====================================================
// ALLOWED FILE TYPES
// =====================================================

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
  '.txt',
] as const;

export const MIME_TO_EXTENSION_MAP: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'text/plain': ['.txt'],
};

// =====================================================
// FILE SIZE LIMITS
// =====================================================

// 50MB maximum file size
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_MB = 50;

// =====================================================
// FILENAME VALIDATION
// =====================================================

const MAX_FILENAME_LENGTH = 200;

/**
 * Sanitize filename for safe storage
 * 
 * Security:
 * - Removes path traversal sequences (../, ..\, /)
 * - Removes null bytes
 * - Removes control characters
 * - Limits length
 * - Preserves extension
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * 
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    throw new Error('Filename is required');
  }

  // Extract extension first
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot >= 0 ? filename.slice(lastDot) : '';
  const nameWithoutExt = lastDot >= 0 ? filename.slice(0, lastDot) : filename;

  // Sanitize the name part
  let sanitized = nameWithoutExt
    // Remove path traversal sequences
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters (keep alphanumeric, hyphens, underscores)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Convert to lowercase
    .toLowerCase();

  // If name is empty after sanitization, use a default
  if (!sanitized) {
    sanitized = 'document';
  }

  // Limit length (reserve space for extension)
  const maxNameLength = MAX_FILENAME_LENGTH - extension.length;
  if (sanitized.length > maxNameLength) {
    sanitized = sanitized.slice(0, maxNameLength);
  }

  // Add extension back
  return sanitized + extension.toLowerCase();
}

/**
 * Extract file extension from filename
 * 
 * @param filename Filename with extension
 * @returns Extension (including dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Validate filename security
 * 
 * Checks for:
 * - Path traversal attempts
 * - Null bytes
 * - Control characters
 * - Multiple extensions
 * - Hidden files
 * 
 * @param filename Filename to validate
 * @returns True if safe
 */
export function isFilenameSecure(filename: string): boolean {
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(filename)) {
    return false;
  }

  // Check for hidden files (starting with .)
  if (filename.startsWith('.')) {
    return false;
  }

  // Check for multiple extensions (e.g., file.pdf.exe)
  const parts = filename.split('.');
  if (parts.length > 2) {
    return false;
  }

  return true;
}

// =====================================================
// FILE TYPE VALIDATION
// =====================================================

/**
 * Validate file MIME type
 * 
 * @param mimeType File MIME type
 * @returns True if allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

/**
 * Validate file extension
 * 
 * @param extension File extension (including dot)
 * @returns True if allowed
 */
export function isAllowedExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension.toLowerCase() as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Validate MIME type matches extension
 * 
 * Basic validation - not foolproof but catches obvious mismatches
 * 
 * @param mimeType File MIME type
 * @param filename Filename with extension
 * @returns True if match is reasonable
 */
export function mimeTypeMatchesExtension(mimeType: string, filename: string): boolean {
  const extension = getFileExtension(filename);
  const expectedExtensions = MIME_TO_EXTENSION_MAP[mimeType];
  
  if (!expectedExtensions) {
    return false;
  }

  return expectedExtensions.includes(extension);
}

// =====================================================
// FILE SIZE VALIDATION
// =====================================================

/**
 * Validate file size
 * 
 * @param sizeBytes File size in bytes
 * @returns True if within limit
 */
export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Format file size for display
 * 
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// =====================================================
// COMPREHENSIVE FILE VALIDATION
// =====================================================

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate file for upload
 * 
 * Performs all validation checks:
 * - File exists and has content
 * - Size within limits
 * - MIME type allowed
 * - Extension allowed
 * - MIME type matches extension
 * - Filename is secure
 * 
 * @param file File object
 * @returns Validation result with errors
 */
export function validateFile(file: File): FileValidationResult {
  const errors: string[] = [];

  // Check file exists and has content
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Validate file size
  if (!isValidFileSize(file.size)) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    } else {
      errors.push('Invalid file size');
    }
  }

  // Validate MIME type
  if (!isAllowedMimeType(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }

  // Validate extension
  const extension = getFileExtension(file.name);
  if (!isAllowedExtension(extension)) {
    errors.push(`File extension "${extension}" is not allowed`);
  }

  // Validate MIME type matches extension
  if (file.type && !mimeTypeMatchesExtension(file.type, file.name)) {
    errors.push('File type does not match extension');
  }

  // Validate filename security
  if (!isFilenameSecure(file.name)) {
    errors.push('Filename contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// DOCUMENT METADATA VALIDATION
// =====================================================

export interface DocumentMetadata {
  title: string;
  document_type: string;
  description?: string;
  department_id?: string;
}

/**
 * Validate document metadata
 * 
 * @param metadata Document metadata
 * @returns Validation result with errors
 */
export function validateDocumentMetadata(metadata: DocumentMetadata): FileValidationResult {
  const errors: string[] = [];

  // Title is required
  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push('Document title is required');
  } else if (metadata.title.length > 200) {
    errors.push('Document title must be less than 200 characters');
  }

  // Document type is required
  if (!metadata.document_type || metadata.document_type.trim().length === 0) {
    errors.push('Document type is required');
  }

  // Description is optional but has length limit
  if (metadata.description && metadata.description.length > 1000) {
    errors.push('Document description must be less than 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
