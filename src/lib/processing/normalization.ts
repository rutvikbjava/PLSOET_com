/**
 * Text Normalization Service
 * 
 * Cleans and normalizes extracted text for AI processing:
 * - Remove excessive whitespace
 * - Fix broken line endings
 * - Remove extraction artifacts
 * - Preserve meaningful structure
 * 
 * IMPORTANT: Does NOT aggressively rewrite content
 * IMPORTANT: Does NOT hallucinate missing content
 * IMPORTANT: Preserves meaning
 * 
 * @module processing/normalization
 */

/**
 * Normalization options
 */
export interface NormalizationOptions {
  /**
   * Maximum consecutive blank lines to preserve
   * @default 2
   */
  maxBlankLines?: number;

  /**
   * Preserve paragraph structure
   * @default true
   */
  preserveParagraphs?: boolean;

  /**
   * Remove common extraction artifacts
   * @default true
   */
  removeArtifacts?: boolean;
}

/**
 * Normalize extracted text
 * 
 * Performs safe, non-destructive normalization:
 * 1. Normalize line endings (CRLF → LF)
 * 2. Remove excessive whitespace
 * 3. Limit consecutive blank lines
 * 4. Remove common extraction artifacts
 * 5. Trim trailing/leading whitespace
 * 
 * @param text Raw extracted text
 * @param options Normalization options
 * @returns Normalized text
 */
export function normalizeText(
  text: string,
  options: NormalizationOptions = {}
): string {
  const {
    maxBlankLines = 2,
    preserveParagraphs = true,
    removeArtifacts = true,
  } = options;

  let normalized = text;

  // Step 1: Normalize line endings (CRLF → LF)
  normalized = normalized.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\r/g, '\n');

  // Step 2: Remove common extraction artifacts if enabled
  if (removeArtifacts) {
    // Remove page numbers (common pattern: "Page 1 of 10" or just "1")
    normalized = normalized.replace(/\n\s*Page \d+ of \d+\s*\n/gi, '\n');
    normalized = normalized.replace(/\n\s*\d+\s*\n/g, '\n');

    // Remove header/footer markers (repeated lines)
    normalized = removeRepeatedLines(normalized);

    // Remove PDF extraction artifacts (random characters)
    normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  }

  // Step 3: Normalize whitespace
  // Replace tabs with spaces
  normalized = normalized.replace(/\t/g, '    ');

  // Remove trailing whitespace from each line
  normalized = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Step 4: Limit consecutive blank lines
  if (maxBlankLines > 0) {
    const blankLinePattern = new RegExp(`\\n{${maxBlankLines + 1},}`, 'g');
    const replacement = '\n'.repeat(maxBlankLines);
    normalized = normalized.replace(blankLinePattern, replacement);
  }

  // Step 5: Preserve paragraph structure if enabled
  if (preserveParagraphs) {
    // Ensure double newline between paragraphs
    // But don't create triple newlines
    normalized = normalized.replace(/\n{2,}/g, '\n\n');
  } else {
    // Collapse all whitespace
    normalized = normalized.replace(/\n{2,}/g, '\n');
  }

  // Step 6: Trim leading/trailing whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Remove repeated lines (common in headers/footers)
 * 
 * If a line appears more than 3 times, assume it's a header/footer
 * and remove all occurrences.
 * 
 * @param text Text to process
 * @returns Text with repeated lines removed
 */
function removeRepeatedLines(text: string): string {
  const lines = text.split('\n');
  const lineCounts = new Map<string, number>();

  // Count non-empty lines
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
    }
  });

  // Identify repeated lines (appearing > 3 times)
  const repeatedLines = new Set<string>();
  lineCounts.forEach((count, line) => {
    if (count > 3) {
      repeatedLines.add(line);
    }
  });

  // Remove repeated lines
  if (repeatedLines.size > 0) {
    return lines
      .filter((line) => !repeatedLines.has(line.trim()))
      .join('\n');
  }

  return text;
}

/**
 * Extract sections from normalized text
 * 
 * Attempts to identify major sections based on:
 * - Headings (lines followed by blank line)
 * - All-caps lines (potential headings)
 * - Numbered sections
 * 
 * @param text Normalized text
 * @returns Array of sections with titles and content
 */
export interface TextSection {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
}

export function extractSections(text: string): TextSection[] {
  const lines = text.split('\n');
  const sections: TextSection[] = [];
  let currentSection: TextSection | null = null;
  let lineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const trimmed = line.trim();

    // Detect potential heading:
    // - Short line (< 100 chars)
    // - Followed by blank line or end
    // - All caps OR numbered section OR ends with colon
    const isLastLine = i === lines.length - 1;
    const nextLine = isLastLine ? '' : (lines[i + 1] || '').trim();
    const isFollowedByBlank = nextLine === '';

    const isShort = trimmed.length > 0 && trimmed.length < 100;
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
    const isNumbered = /^\d+\./.test(trimmed);
    const endsWithColon = trimmed.endsWith(':');

    const isPotentialHeading =
      isShort &&
      (isAllCaps || isNumbered || endsWithColon) &&
      (isFollowedByBlank || isLastLine);

    if (isPotentialHeading) {
      // Save previous section
      if (currentSection) {
        currentSection.endLine = lineNumber - 1;
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: trimmed,
        content: '',
        startLine: lineNumber,
        endLine: lineNumber,
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.content += line + '\n';
    } else if (trimmed.length > 0) {
      // Content before first heading
      if (sections.length === 0) {
        currentSection = {
          title: '(Introduction)',
          content: line + '\n',
          startLine: 0,
          endLine: 0,
        };
      }
    }

    lineNumber++;
  }

  // Save last section
  if (currentSection) {
    currentSection.endLine = lineNumber - 1;
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Calculate text statistics
 * 
 * @param text Normalized text
 * @returns Text statistics
 */
export interface TextStatistics {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
  averageWordsPerParagraph: number;
}

export function calculateStatistics(text: string): TextStatistics {
  const characterCount = text.length;
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const lineCount = text.split('\n').length;

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const averageWordsPerParagraph =
    paragraphCount > 0 ? Math.round(wordCount / paragraphCount) : 0;

  return {
    characterCount,
    wordCount,
    lineCount,
    paragraphCount,
    averageWordsPerParagraph,
  };
}

/**
 * Truncate text to maximum length while preserving word boundaries
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length in characters
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}
