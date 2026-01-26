/**
 * Default section introduction text for portfolio sections.
 * These are profession-agnostic, industry-neutral defaults that can be
 * customized by users through the admin panel.
 */

export const DEFAULT_SECTION_INTROS = {
  skills: "An overview of the skills and tools used across professional projects.",
  projects: "A selection of projects highlighting problem-solving and delivery experience.",
  experience: "A summary of professional experience and roles over time.",
  architecture: "An overview of the technical principles and architectural approach behind this work.",
  contact: "Feel free to reach out for professional inquiries or collaboration opportunities.",
} as const;

/**
 * Get the effective intro text for a section.
 * Returns user's custom text if provided, otherwise returns the default.
 */
export function getSectionIntro(
  userIntro: string | null | undefined,
  section: keyof typeof DEFAULT_SECTION_INTROS
): string | undefined {
  if (userIntro && userIntro.trim()) {
    return userIntro.trim();
  }
  return DEFAULT_SECTION_INTROS[section];
}
