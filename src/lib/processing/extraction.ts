/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * File Extraction Service
 * 
 * Extracts text content from various document formats:
 * - PDF (text-based, detects image-only PDFs)
 * - DOCX (Microsoft Word documents)
 * - TXT (plain text files)
 * 
 * Security:
 * - Handles corrupt files safely
 * - Detects empty extractions
 * - Preserves useful structure
 * - Does NOT perform OCR (future capability)
 * 
 * @module processing/extraction
 */

import mammoth from 'mammoth';

// Use dynamic import for PDF.js to avoid canvas dependency issues
// PDF.js will be loaded only when needed in serverless environment

/**
 * Extraction result with metadata
 */
export interface ExtractionResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    isEmpty: boolean;
    isImageOnly?: boolean; // For PDFs with no extractable text
    format: string;
    extractionMethod: string;
  };
}

/**
 * Extraction error with categorization
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public category: 'UNSUPPORTED' | 'CORRUPT' | 'EMPTY' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * Extract text from PDF file using PDF.js (pdfjs-dist)
 * 
 * Handles:
 * - Text-based PDFs
 * - Empty PDFs
 * - Image-only PDFs (detects, does not OCR)
 * - Corrupted PDFs
 * 
 * @param buffer PDF file buffer
 * @returns Extraction result with metadata
 */
export async function extractPDF(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Dynamically import PDF.js (non-legacy build, no canvas required)
    const pdfjs = await import('pdfjs-dist');
    
    // Convert Buffer to Uint8Array for PDF.js
    const data = new Uint8Array(buffer);

    // Load the PDF document without worker (serverless compatible)
    const loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;

    const pageCount = pdfDocument.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatenate text items with spaces
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');

      fullText += pageText + '\n\n';
    }

    const text = fullText.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;

    // Detect image-only PDFs (pages exist but no text)
    const isImageOnly = pageCount > 0 && wordCount < 10;

    if (isImageOnly) {
      return {
        text: '',
        metadata: {
          pageCount,
          wordCount: 0,
          isEmpty: true,
          isImageOnly: true,
          format: 'PDF',
          extractionMethod: 'pdfjs-dist',
        },
      };
    }

    return {
      text,
      metadata: {
        pageCount,
        wordCount,
        isEmpty: wordCount === 0,
        isImageOnly: false,
        format: 'PDF',
        extractionMethod: 'pdfjs-dist',
      },
    };
  } catch (error) {
    // Categorize PDF errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Invalid PDF')) {
      throw new ExtractionError(
        'Invalid or corrupted PDF file',
        'CORRUPT',
        error
      );
    }

    throw new ExtractionError(
      'Failed to extract text from PDF',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Extract text from DOCX file
 * 
 * Preserves:
 * - Paragraphs (separated by double newlines)
 * - Basic structure
 * 
 * @param buffer DOCX file buffer
 * @returns Extraction result with metadata
 */
export async function extractDOCX(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;

    // Check for extraction warnings (malformed DOCX)
    if (result.messages.length > 0) {
      console.warn('[DOCX_EXTRACTION_WARNINGS]', result.messages);
    }

    return {
      text,
      metadata: {
        wordCount,
        isEmpty: wordCount === 0,
        format: 'DOCX',
        extractionMethod: 'mammoth',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('not a valid zip file')) {
      throw new ExtractionError(
        'Invalid or corrupted DOCX file',
        'CORRUPT',
        error
      );
    }

    throw new ExtractionError(
      'Failed to extract text from DOCX',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Extract text from plain text file
 * 
 * Handles:
 * - UTF-8 encoding
 * - Other common encodings (attempts UTF-8, falls back to Latin-1)
 * 
 * @param buffer Text file buffer
 * @returns Extraction result with metadata
 */
export async function extractTXT(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Try UTF-8 first
    let text = buffer.toString('utf-8').trim();

    // Check for invalid UTF-8 (replacement characters)
    if (text.includes('\uFFFD')) {
      // Fallback to Latin-1
      text = buffer.toString('latin1').trim();
    }

    const wordCount = text ? text.split(/\s+/).length : 0;

    return {
      text,
      metadata: {
        wordCount,
        isEmpty: wordCount === 0,
        format: 'TXT',
        extractionMethod: 'buffer-decode',
      },
    };
  } catch (error) {
    throw new ExtractionError(
      'Failed to extract text from TXT file',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Extract text from file based on MIME type
 * 
 * Supported formats:
 * - application/pdf
 * - application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX)
 * - application/msword (DOC - treated as unsupported, needs different library)
 * - text/plain
 * 
 * @param buffer File buffer
 * @param mimeType File MIME type
 * @returns Extraction result with metadata
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  switch (mimeType) {
    case 'application/pdf':
      return extractPDF(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDOCX(buffer);

    case 'text/plain':
      return extractTXT(buffer);

    case 'application/msword': // .doc (old format)
      throw new ExtractionError(
        'DOC format not supported. Please convert to DOCX.',
        'UNSUPPORTED'
      );

    case 'application/vnd.ms-excel': // .xls
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // .xlsx
      throw new ExtractionError(
        'Spreadsheet extraction not yet implemented',
        'UNSUPPORTED'
      );

    case 'image/jpeg':
    case 'image/png':
      throw new ExtractionError(
        'Image OCR not yet implemented',
        'UNSUPPORTED'
      );

    default:
      throw new ExtractionError(
        `Unsupported file type: ${mimeType}`,
        'UNSUPPORTED'
      );
  }
}

/**
 * Validate extraction result quality
 * 
 * Checks:
 * - Minimum word count (10 words)
 * - Not image-only PDF
 * 
 * @param result Extraction result
 * @returns True if extraction is sufficient for processing
 */
export function isExtractionSufficient(result: ExtractionResult): boolean {
  // Image-only PDFs are insufficient
  if (result.metadata.isImageOnly) {
    return false;
  }

  // Need at least 10 words for meaningful processing
  if (result.metadata.wordCount < 10) {
    return false;
  }

  return true;
}

/**
 * Format extraction metadata for logging
 * 
 * @param result Extraction result
 * @returns Human-readable metadata string
 */
export function formatExtractionMetadata(result: ExtractionResult): string {
  const parts: string[] = [
    `format=${result.metadata.format}`,
    `words=${result.metadata.wordCount}`,
  ];

  if (result.metadata.pageCount) {
    parts.push(`pages=${result.metadata.pageCount}`);
  }

  if (result.metadata.isImageOnly) {
    parts.push('image-only=true');
  }

  if (result.metadata.isEmpty) {
    parts.push('empty=true');
  }

  return parts.join(', ');
}
