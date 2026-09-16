/**
 * Document Validation Tests
 * 
 * Tests for file and metadata validation functions.
 */

import {
  MAX_FILE_SIZE_BYTES,
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
} from '@/lib/documents/validation';

describe('Document Validation', () => {
  describe('sanitizeFilename', () => {
    it('should remove path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd.pdf')).toBe('etcpasswd.pdf');
      expect(sanitizeFilename('..\\..\\windows\\system32.pdf')).toBe('windowssystem32.pdf');
    });

    it('should remove control characters', () => {
      expect(sanitizeFilename('file\x00name.pdf')).toBe('filename.pdf');
      expect(sanitizeFilename('file\nname.pdf')).toBe('filename.pdf');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeFilename('my document file.pdf')).toBe('my-document-file.pdf');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file@#$%name.pdf')).toBe('filename.pdf');
    });

    it('should preserve extension', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('DOCUMENT.PDF')).toBe('document.pdf');
    });

    it('should handle files without extension', () => {
      expect(sanitizeFilename('document')).toBe('document');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(200);
      expect(sanitized.endsWith('.pdf')).toBe(true);
    });

    it('should use default name if empty after sanitization', () => {
      expect(sanitizeFilename('...pdf')).toBe('document.pdf');
      expect(sanitizeFilename('@@@@.pdf')).toBe('document.pdf');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.PNG')).toBe('.png');
    });

    it('should return empty string for no extension', () => {
      expect(getFileExtension('document')).toBe('');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('my.document.pdf')).toBe('.pdf');
    });
  });

  describe('isFilenameSecure', () => {
    it('should reject path traversal attempts', () => {
      expect(isFilenameSecure('../file.pdf')).toBe(false);
      expect(isFilenameSecure('dir/file.pdf')).toBe(false);
      expect(isFilenameSecure('dir\\file.pdf')).toBe(false);
    });

    it('should reject null bytes', () => {
      expect(isFilenameSecure('file\x00.pdf')).toBe(false);
    });

    it('should reject control characters', () => {
      expect(isFilenameSecure('file\n.pdf')).toBe(false);
    });

    it('should reject hidden files', () => {
      expect(isFilenameSecure('.hidden.pdf')).toBe(false);
    });

    it('should reject multiple extensions', () => {
      expect(isFilenameSecure('file.pdf.exe')).toBe(false);
    });

    it('should accept safe filenames', () => {
      expect(isFilenameSecure('document.pdf')).toBe(true);
      expect(isFilenameSecure('my-file_123.pdf')).toBe(true);
    });
  });

  describe('isAllowedMimeType', () => {
    it('should allow PDF', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('should allow Word documents', () => {
      expect(isAllowedMimeType('application/msword')).toBe(true);
      expect(isAllowedMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('should allow Excel files', () => {
      expect(isAllowedMimeType('application/vnd.ms-excel')).toBe(true);
      expect(isAllowedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    });

    it('should allow images', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should allow text files', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true);
    });

    it('should reject disallowed types', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
      expect(isAllowedMimeType('video/mp4')).toBe(false);
      expect(isAllowedMimeType('audio/mp3')).toBe(false);
    });
  });

  describe('isAllowedExtension', () => {
    it('should allow common extensions', () => {
      expect(isAllowedExtension('.pdf')).toBe(true);
      expect(isAllowedExtension('.doc')).toBe(true);
      expect(isAllowedExtension('.docx')).toBe(true);
      expect(isAllowedExtension('.xls')).toBe(true);
      expect(isAllowedExtension('.xlsx')).toBe(true);
      expect(isAllowedExtension('.jpg')).toBe(true);
      expect(isAllowedExtension('.jpeg')).toBe(true);
      expect(isAllowedExtension('.png')).toBe(true);
      expect(isAllowedExtension('.txt')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isAllowedExtension('.PDF')).toBe(true);
      expect(isAllowedExtension('.DOCX')).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      expect(isAllowedExtension('.exe')).toBe(false);
      expect(isAllowedExtension('.bat')).toBe(false);
      expect(isAllowedExtension('.sh')).toBe(false);
    });
  });

  describe('mimeTypeMatchesExtension', () => {
    it('should match PDF', () => {
      expect(mimeTypeMatchesExtension('application/pdf', 'document.pdf')).toBe(true);
    });

    it('should match JPEG', () => {
      expect(mimeTypeMatchesExtension('image/jpeg', 'photo.jpg')).toBe(true);
      expect(mimeTypeMatchesExtension('image/jpeg', 'photo.jpeg')).toBe(true);
    });

    it('should reject mismatches', () => {
      expect(mimeTypeMatchesExtension('application/pdf', 'document.docx')).toBe(false);
      expect(mimeTypeMatchesExtension('image/png', 'image.jpg')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept valid sizes', () => {
      expect(isValidFileSize(1024)).toBe(true); // 1KB
      expect(isValidFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(isValidFileSize(MAX_FILE_SIZE_BYTES)).toBe(true); // Max size
    });

    it('should reject zero or negative', () => {
      expect(isValidFileSize(0)).toBe(false);
      expect(isValidFileSize(-1)).toBe(false);
    });

    it('should reject oversized files', () => {
      expect(isValidFileSize(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });
  });

  describe('validateFile', () => {
    // Mock File object
    const createMockFile = (name: string, size: number, type: string): File => {
      return {
        name,
        size,
        type,
      } as File;
    };

    it('should validate a good file', () => {
      const file = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized files', () => {
      const file = createMockFile('huge.pdf', MAX_FILE_SIZE_BYTES + 1, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds 50MB limit');
    });

    it('should reject empty files', () => {
      const file = createMockFile('empty.pdf', 0, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should reject disallowed MIME types', () => {
      const file = createMockFile('video.mp4', 1024, 'video/mp4');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not allowed'))).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      const file = createMockFile('script.exe', 1024, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('extension'))).toBe(true);
    });

    it('should reject mismatched MIME type and extension', () => {
      const file = createMockFile('document.pdf', 1024, 'image/png');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('does not match'))).toBe(true);
    });

    it('should reject insecure filenames', () => {
      const file = createMockFile('../../../etc/passwd.pdf', 1024, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid characters'))).toBe(true);
    });
  });

  describe('validateDocumentMetadata', () => {
    it('should validate good metadata', () => {
      const metadata = {
        title: 'My Document',
        document_type: 'Report',
        description: 'A test document',
        department_id: '123',
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require title', () => {
      const metadata = {
        title: '',
        document_type: 'Report',
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Document title is required');
    });

    it('should require document type', () => {
      const metadata = {
        title: 'My Document',
        document_type: '',
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Document type is required');
    });

    it('should reject too-long titles', () => {
      const metadata = {
        title: 'a'.repeat(201),
        document_type: 'Report',
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('less than 200'))).toBe(true);
    });

    it('should reject too-long descriptions', () => {
      const metadata = {
        title: 'My Document',
        document_type: 'Report',
        description: 'a'.repeat(1001),
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('less than 1000'))).toBe(true);
    });

    it('should allow optional description', () => {
      const metadata = {
        title: 'My Document',
        document_type: 'Report',
      };
      const result = validateDocumentMetadata(metadata);
      expect(result.valid).toBe(true);
    });
  });
});
