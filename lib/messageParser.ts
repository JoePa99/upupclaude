/**
 * Message Parser - Utilities for progressive disclosure
 * Detects long messages and splits them into collapsible sections
 */

export interface MessageSection {
  title: string;
  content: string;
  index: number;
}

/**
 * Detects if a message should use progressive disclosure
 * Criteria: Has 3+ H2 sections OR is longer than 1000 characters
 */
export function shouldUseProgressiveDisclosure(content: string): boolean {
  const h2Count = (content.match(/^## /gm) || []).length;
  const isLong = content.length > 1000;

  return h2Count >= 3 || (h2Count >= 2 && isLong);
}

/**
 * Splits message content into sections based on H2 headers
 * Returns array of {title, content, index}
 */
export function splitIntoSections(content: string): MessageSection[] {
  const sections: MessageSection[] = [];

  // Split by H2 headers (## Title)
  const parts = content.split(/^## (.+)$/gm);

  // If no H2 headers found, return the whole content as one section
  if (parts.length === 1) {
    return [{
      title: 'Content',
      content: parts[0].trim(),
      index: 0,
    }];
  }

  // First part is content before any H2 (intro)
  if (parts[0].trim()) {
    sections.push({
      title: 'Overview',
      content: parts[0].trim(),
      index: 0,
    });
  }

  // Process remaining parts (pairs of title + content)
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i];
    const content = parts[i + 1] || '';

    sections.push({
      title: title.trim(),
      content: content.trim(),
      index: sections.length,
    });
  }

  return sections;
}

/**
 * Estimates reading time in minutes
 */
export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
