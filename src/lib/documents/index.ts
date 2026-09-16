/**
 * Document Management Utilities
 * 
 * Centralized exports for document-related functionality.
 */

// Validation utilities
export {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  sanitizeFilename,
  getFileExtension,
  isFilenameSecure,
  isAllowedMimeType,
  isAllowedExtension,
  mimeTypeMatchesExtension,
  isValidFileSize,
  formatFileSize,
  validateFile,
  validateDocumentMetadata,
  type FileValidationResult,
  type DocumentMetadata,
} from './validation';

// Storage utilities
export {
  STORAGE_BUCKET,
  SIGNED_URL_EXPIRY_SECONDS,
  generateStoragePath,
  parseInstitutionIdFromPath,
  parseDocumentIdFromPath,
  parseVersionNumberFromPath,
  extractFilenameFromPath,
  formatBytes,
  getContentTypeFromFilename,
  formatStorageError,
  logOrphanedFile,
  type StorageError,
} from './storage';
