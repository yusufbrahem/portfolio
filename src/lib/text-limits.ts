/**
 * Global text length limits for all user-entered content
 * These limits are enforced at both UI and server levels
 */

export const TEXT_LIMITS = {
  // Titles and names
  TITLE: 80, // Section titles, project titles, role titles, etc.
  NAME: 80, // Person names, skill group names, etc.
  
  // Short labels
  LABEL: 40, // Tags, skills, short labels
  TAG: 40, // Project tags, skill names
  
  // Section introductions
  SECTION_INTRO: 240, // Section introduction text
  
  // Descriptions and summaries
  SUMMARY: 600, // Project summaries, role descriptions
  DESCRIPTION: 600, // General descriptions
  
  // Long text
  LONG_TEXT: 1200, // About paragraphs, long descriptions
  
  // Bullet points
  BULLET: 160, // Bullet point text
  
  // URLs
  URL: 300, // LinkedIn URLs, CV URLs, etc.
  
  // Contact fields
  CONTACT_MESSAGE: 500, // Contact section message
  
  // Hero content
  HEADLINE: 100, // Hero headline
  SUBHEADLINE: 1000, // Hero subheadline
  HIGHLIGHT: 100, // Hero highlight items
  
  // Architecture
  ARCHITECTURE_PILLAR_TITLE: 80, // Architecture pillar titles
  ARCHITECTURE_POINT: 200, // Architecture point descriptions
} as const;

/**
 * Get character count display string
 */
export function getCharCountDisplay(current: number, max: number): string {
  return `${current} / ${max}`;
}

/**
 * Check if text exceeds limit
 */
export function exceedsLimit(text: string, limit: number): boolean {
  return text.trim().length > limit;
}

/**
 * Get remaining characters
 */
export function getRemainingChars(text: string, limit: number): number {
  return limit - text.trim().length;
}

/**
 * Validate text length
 */
export function validateTextLength(
  text: string,
  limit: number,
  fieldName: string
): { isValid: boolean; error: string | null } {
  const trimmed = text.trim();
  if (trimmed.length > limit) {
    return {
      isValid: false,
      error: `${fieldName} must be ${limit} characters or less (currently ${trimmed.length})`,
    };
  }
  return { isValid: true, error: null };
}
