/**
 * Document Processing Module
 * 
 * Public exports for document processing pipeline
 */

// Extraction
export {
  extractText,
  extractPDF,
  extractDOCX,
  extractTXT,
  isExtractionSufficient,
  formatExtractionMetadata,
  ExtractionError,
  type ExtractionResult,
} from './extraction';

// Normalization
export {
  normalizeText,
  extractSections,
  calculateStatistics,
  truncateText,
  type NormalizationOptions,
  type TextSection,
  type TextStatistics,
} from './normalization';

// AI Provider
export {
  extractContext,
  isProviderConfigured,
  getRecommendedProvider,
  AIExtractionError,
  type DocumentContext,
  type AIExtractionConfig,
  type AIExtractionResult,
} from './ai-provider';

// Context Engine
export {
  processDocument,
  retryProcessing,
  getProcessingStatus,
  type ProcessingResult,
  type ProcessingOptions,
} from './context-engine';
