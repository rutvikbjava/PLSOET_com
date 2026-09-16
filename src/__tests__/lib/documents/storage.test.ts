/**
 * Document Storage Tests
 * 
 * Tests for storage path generation and utility functions.
 */

import {
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
} from '@/lib/documents/storage';

describe('Document Storage', () => {
  describe('generateStoragePath', () => {
    it('should generate valid storage path', () => {
      const path = generateStoragePath(
        'inst-123',
        'doc-456',
        1,
        'document.pdf'
      );
      expect(path).toBe('inst-123/documents/doc-456/versions/1/document.pdf');
    });

    it('should sanitize filename', () => {
      const path = generateStoragePath(
        'inst-123',
        'doc-456',
        1,
        'My Document File.pdf'
      );
      expect(path).toBe('inst-123/documents/doc-456/versions/1/my-document-file.pdf');
    });

    it('should handle multiple versions', () => {
      const path1 = generateStoragePath('inst-123', 'doc-456', 1, 'doc.pdf');
      const path2 = generateStoragePath('inst-123', 'doc-456', 2, 'doc.pdf');
      const path3 = generateStoragePath('inst-123', 'doc-456', 10, 'doc.pdf');
      
      expect(path1).toContain('/versions/1/');
      expect(path2).toContain('/versions/2/');
      expect(path3).toContain('/versions/10/');
    });

    it('should throw error for missing parameters', () => {
      expect(() => generateStoragePath('', 'doc-456', 1, 'doc.pdf')).toThrow();
      expect(() => generateStoragePath('inst-123', '', 1, 'doc.pdf')).toThrow();
      expect(() => generateStoragePath('inst-123', 'doc-456', 0, 'doc.pdf')).toThrow();
      expect(() => generateStoragePath('inst-123', 'doc-456', 1, '')).toThrow();
    });

    it('should throw error for invalid version number', () => {
      expect(() => generateStoragePath('inst-123', 'doc-456', 0, 'doc.pdf')).toThrow();
      expect(() => generateStoragePath('inst-123', 'doc-456', -1, 'doc.pdf')).toThrow();
    });
  });

  describe('parseInstitutionIdFromPath', () => {
    it('should extract institution ID', () => {
      const path = 'inst-123/documents/doc-456/versions/1/document.pdf';
      expect(parseInstitutionIdFromPath(path)).toBe('inst-123');
    });

    it('should return null for invalid path', () => {
      expect(parseInstitutionIdFromPath('')).toBe(null);
    });
  });

  describe('parseDocumentIdFromPath', () => {
    it('should extract document ID', () => {
      const path = 'inst-123/documents/doc-456/versions/1/document.pdf';
      expect(parseDocumentIdFromPath(path)).toBe('doc-456');
    });

    it('should return null for invalid path', () => {
      expect(parseDocumentIdFromPath('inst-123')).toBe(null);
      expect(parseDocumentIdFromPath('inst-123/documents')).toBe(null);
    });
  });

  describe('parseVersionNumberFromPath', () => {
    it('should extract version number', () => {
      const path1 = 'inst-123/documents/doc-456/versions/1/document.pdf';
      const path2 = 'inst-123/documents/doc-456/versions/10/document.pdf';
      
      expect(parseVersionNumberFromPath(path1)).toBe(1);
      expect(parseVersionNumberFromPath(path2)).toBe(10);
    });

    it('should return null for invalid path', () => {
      expect(parseVersionNumberFromPath('inst-123')).toBe(null);
      expect(parseVersionNumberFromPath('inst-123/documents/doc-456')).toBe(null);
    });

    it('should return null for non-numeric version', () => {
      const path = 'inst-123/documents/doc-456/versions/abc/document.pdf';
      expect(parseVersionNumberFromPath(path)).toBe(null);
    });
  });

  describe('extractFilenameFromPath', () => {
    it('should extract filename', () => {
      const path = 'inst-123/documents/doc-456/versions/1/document.pdf';
      expect(extractFilenameFromPath(path)).toBe('document.pdf');
    });

    it('should handle simple filename', () => {
      expect(extractFilenameFromPath('document.pdf')).toBe('document.pdf');
    });

    it('should return null for empty path', () => {
      expect(extractFilenameFromPath('')).toBe(null);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getContentTypeFromFilename', () => {
    it('should return correct content types', () => {
      expect(getContentTypeFromFilename('document.pdf')).toBe('application/pdf');
      expect(getContentTypeFromFilename('document.doc')).toBe('application/msword');
      expect(getContentTypeFromFilename('document.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getContentTypeFromFilename('spreadsheet.xls')).toBe('application/vnd.ms-excel');
      expect(getContentTypeFromFilename('spreadsheet.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(getContentTypeFromFilename('image.jpg')).toBe('image/jpeg');
      expect(getContentTypeFromFilename('image.jpeg')).toBe('image/jpeg');
      expect(getContentTypeFromFilename('image.png')).toBe('image/png');
      expect(getContentTypeFromFilename('file.txt')).toBe('text/plain');
    });

    it('should be case insensitive', () => {
      expect(getContentTypeFromFilename('document.PDF')).toBe('application/pdf');
      expect(getContentTypeFromFilename('document.DOCX')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should return default for unknown extensions', () => {
      expect(getContentTypeFromFilename('file.xyz')).toBe('application/octet-stream');
      expect(getContentTypeFromFilename('noextension')).toBe('application/octet-stream');
    });
  });

  describe('formatStorageError', () => {
    it('should format RLS errors', () => {
      const error = { message: 'new row violates row-level security policy' };
      expect(formatStorageError(error)).toBe('You do not have permission to perform this operation');
    });

    it('should format duplicate key errors', () => {
      const error = { message: 'duplicate key value violates unique constraint' };
      expect(formatStorageError(error)).toBe('A version with this number already exists');
    });

    it('should format 404 errors', () => {
      expect(formatStorageError({ statusCode: 404 })).toBe('Document not found');
      expect(formatStorageError({ status: 404 })).toBe('Document not found');
    });

    it('should format 403 errors', () => {
      expect(formatStorageError({ statusCode: 403 })).toBe('Access denied');
      expect(formatStorageError({ status: 403 })).toBe('Access denied');
    });

    it('should format size errors', () => {
      const error = { message: 'file size exceeds maximum allowed' };
      expect(formatStorageError(error)).toBe('File size exceeds maximum allowed');
    });

    it('should format type errors', () => {
      const error = { message: 'file type not allowed' };
      expect(formatStorageError(error)).toBe('File type not allowed');
    });

    it('should return generic message for unknown errors', () => {
      const error = { message: 'some random error' };
      expect(formatStorageError(error)).toBe('An error occurred while processing your request');
    });
  });

  describe('constants', () => {
    it('should have correct storage bucket name', () => {
      expect(STORAGE_BUCKET).toBe('institutional-documents');
    });

    it('should have correct signed URL expiry', () => {
      expect(SIGNED_URL_EXPIRY_SECONDS).toBe(60);
    });
  });
});
