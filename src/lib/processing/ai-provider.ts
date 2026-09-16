/**
 * AI Provider Abstraction
 * 
 * Provider-agnostic interface for AI-powered document analysis.
 * Currently supports OpenAI, but designed to support multiple providers.
 * 
 * Security:
 * - API keys remain server-side only
 * - Never expose keys to client
 * - Log metadata, not sensitive content
 * 
 * @module processing/ai-provider
 */

/**
 * Structured context extraction from document
 */
export interface DocumentContext {
  document_type_detected: string | null;
  creator_role_detected: string | null;
  department_scope: string | null;
  purpose: string | null;
  impact_level: string | null;
  extracted_attributes: Record<string, unknown>;
  confidence_score: number;
}

/**
 * AI extraction configuration
 */
export interface AIExtractionConfig {
  provider: 'openai' | 'mock';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI extraction result with metadata
 */
export interface AIExtractionResult {
  context: DocumentContext;
  metadata: {
    model: string;
    provider: string;
    tokensUsed?: number;
    processingTime: number;
    promptVersion: string;
  };
}

/**
 * AI extraction error
 */
export class AIExtractionError extends Error {
  constructor(
    message: string,
    public category: 'PROVIDER_ERROR' | 'INVALID_RESPONSE' | 'RATE_LIMIT' | 'AUTHENTICATION' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIExtractionError';
  }
}

/**
 * Current prompt version for tracking
 * Increment when prompt logic changes significantly
 */
const PROMPT_VERSION = 'v1.0.0';

/**
 * Extract structured context from normalized text using AI
 * 
 * @param normalizedText Cleaned document text
 * @param config AI extraction configuration
 * @returns Structured context with metadata
 */
export async function extractContext(
  normalizedText: string,
  config: AIExtractionConfig
): Promise<AIExtractionResult> {
  const startTime = Date.now();

  try {
    if (config.provider === 'mock') {
      return extractContextMock(normalizedText, startTime);
    }

    if (config.provider === 'openai') {
      return await extractContextOpenAI(normalizedText, config, startTime);
    }

    throw new AIExtractionError(
      `Unsupported provider: ${config.provider}`,
      'UNKNOWN'
    );
  } catch (error) {
    if (error instanceof AIExtractionError) {
      throw error;
    }

    throw new AIExtractionError(
      'Failed to extract context',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Extract context using OpenAI
 * 
 * NOTE: This requires OPENAI_API_KEY environment variable
 * 
 * @param text Normalized text
 * @param config Configuration
 * @param startTime Start timestamp
 * @returns Extraction result
 */
async function extractContextOpenAI(
  text: string,
  config: AIExtractionConfig,
  startTime: number
): Promise<AIExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIExtractionError(
      'OPENAI_API_KEY environment variable not configured',
      'AUTHENTICATION'
    );
  }

  const model = config.model || 'gpt-4o-mini';
  const temperature = config.temperature ?? 0.1; // Low temperature for deterministic extraction
  const maxTokens = config.maxTokens || 1000;

  // Build structured extraction prompt
  const prompt = buildExtractionPrompt(text);

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a document analysis expert. Extract structured information from institutional documents. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      
      if (response.status === 401) {
        throw new AIExtractionError(
          'Invalid OpenAI API key',
          'AUTHENTICATION'
        );
      }

      if (response.status === 429) {
        throw new AIExtractionError(
          'OpenAI rate limit exceeded',
          'RATE_LIMIT'
        );
      }

      throw new AIExtractionError(
        `OpenAI API error: ${error.error?.message || 'Unknown'}`,
        'PROVIDER_ERROR'
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new AIExtractionError(
        'Empty response from OpenAI',
        'INVALID_RESPONSE'
      );
    }

    // Parse and validate JSON response
    const extracted = JSON.parse(content);
    const context = validateAndNormalizeContext(extracted);

    const processingTime = Date.now() - startTime;

    return {
      context,
      metadata: {
        model,
        provider: 'openai',
        tokensUsed: data.usage?.total_tokens,
        processingTime,
        promptVersion: PROMPT_VERSION,
      },
    };
  } catch (error) {
    if (error instanceof AIExtractionError) {
      throw error;
    }

    throw new AIExtractionError(
      'OpenAI API request failed',
      'PROVIDER_ERROR',
      error
    );
  }
}

/**
 * Mock extraction for testing without API key
 * 
 * Returns basic structured context based on heuristics
 * 
 * @param text Normalized text
 * @param startTime Start timestamp
 * @returns Mock extraction result
 */
function extractContextMock(
  text: string,
  startTime: number
): AIExtractionResult {
  // Simple heuristic-based extraction
  const lowercaseText = text.toLowerCase();

  let document_type_detected: string | null = null;
  if (lowercaseText.includes('policy') || lowercaseText.includes('procedure')) {
    document_type_detected = 'Policy Document';
  } else if (lowercaseText.includes('requisition') || lowercaseText.includes('purchase')) {
    document_type_detected = 'Purchase Requisition';
  } else if (lowercaseText.includes('memo') || lowercaseText.includes('memorandum')) {
    document_type_detected = 'Memorandum';
  } else {
    document_type_detected = 'General Document';
  }

  let creator_role_detected: string | null = null;
  if (lowercaseText.includes('faculty') || lowercaseText.includes('professor')) {
    creator_role_detected = 'Faculty';
  } else if (lowercaseText.includes('hod') || lowercaseText.includes('head of department')) {
    creator_role_detected = 'Department Head';
  } else if (lowercaseText.includes('principal') || lowercaseText.includes('coe')) {
    creator_role_detected = 'Administration';
  }

  const processingTime = Date.now() - startTime;

  return {
    context: {
      document_type_detected,
      creator_role_detected,
      department_scope: null,
      purpose: 'Extracted using mock provider (no AI configured)',
      impact_level: null,
      extracted_attributes: {
        mock: true,
        wordCount: text.split(/\s+/).length,
      },
      confidence_score: 0.5, // Low confidence for mock extraction
    },
    metadata: {
      model: 'mock-extractor',
      provider: 'mock',
      processingTime,
      promptVersion: PROMPT_VERSION,
    },
  };
}

/**
 * Build extraction prompt for AI model
 * 
 * @param text Document text
 * @returns Formatted prompt
 */
function buildExtractionPrompt(text: string): string {
  // Truncate text if too long (keep first 3000 chars)
  const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;

  return `Analyze the following institutional document and extract structured information.

DOCUMENT TEXT:
${truncatedText}

EXTRACTION REQUIREMENTS:
Extract and return a JSON object with the following fields:

1. document_type_detected: The type of document (e.g., "Policy Document", "Purchase Requisition", "Memorandum", "Application", "Approval Request")

2. creator_role_detected: The likely role of the person who created this document (e.g., "Faculty", "Department Head", "Student", "Administration")

3. department_scope: Which department this document relates to, if mentioned (e.g., "Computer Science", "Electrical Engineering", null if not specific)

4. purpose: A brief one-sentence summary of the document's purpose

5. impact_level: The organizational impact level ("INDIVIDUAL", "DEPARTMENT", "INSTITUTION", or null if unclear)

6. extracted_attributes: A JSON object with any other relevant attributes you extract (e.g., {"mentions_budget": true, "requires_approval": true, "deadline_mentioned": false})

7. confidence_score: Your confidence in this extraction (0.0 to 1.0)

Return ONLY valid JSON. Do not include explanations outside the JSON structure.`;
}

/**
 * Validate and normalize AI extraction response
 * 
 * Ensures response matches expected structure
 * 
 * @param extracted Raw extraction from AI
 * @returns Validated context
 */
function validateAndNormalizeContext(extracted: unknown): DocumentContext {
  if (typeof extracted !== 'object' || extracted === null) {
    throw new AIExtractionError(
      'Invalid extraction format: expected object',
      'INVALID_RESPONSE'
    );
  }

  const obj = extracted as Record<string, unknown>;

  // Validate required fields exist
  const requiredFields = [
    'document_type_detected',
    'creator_role_detected',
    'department_scope',
    'purpose',
    'impact_level',
    'extracted_attributes',
    'confidence_score',
  ];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new AIExtractionError(
        `Missing required field: ${field}`,
        'INVALID_RESPONSE'
      );
    }
  }

  // Normalize confidence score
  let confidenceScore = Number(obj.confidence_score);
  if (isNaN(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
    confidenceScore = 0.5; // Default to medium confidence
  }

  return {
    document_type_detected: obj.document_type_detected as string | null,
    creator_role_detected: obj.creator_role_detected as string | null,
    department_scope: obj.department_scope as string | null,
    purpose: obj.purpose as string | null,
    impact_level: obj.impact_level as string | null,
    extracted_attributes: (obj.extracted_attributes as Record<string, unknown>) || {},
    confidence_score: confidenceScore,
  };
}

/**
 * Check if AI provider is configured
 * 
 * @param provider Provider name
 * @returns True if provider is configured
 */
export function isProviderConfigured(provider: 'openai' | 'mock'): boolean {
  if (provider === 'mock') {
    return true; // Mock is always available
  }

  if (provider === 'openai') {
    return !!process.env.OPENAI_API_KEY;
  }

  return false;
}

/**
 * Get recommended provider based on configuration
 * 
 * @returns Recommended provider
 */
export function getRecommendedProvider(): 'openai' | 'mock' {
  if (isProviderConfigured('openai')) {
    return 'openai';
  }

  return 'mock';
}
