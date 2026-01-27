/**
 * Section types that have admin editors
 */
export const SECTION_TYPES_WITH_EDITORS = new Set([
  "about",
  "skills",
  "projects",
  "experience",
  "architecture",
  "contact",
]);

/**
 * Check if a section type has an admin editor
 */
export function hasSectionEditor(sectionType: string): boolean {
  return SECTION_TYPES_WITH_EDITORS.has(sectionType);
}

/**
 * Get admin route for a section type
 * Returns null if no editor exists
 */
export function getSectionAdminRoute(sectionType: string): string | null {
  const routeMap: Record<string, string> = {
    about: "/admin/about",
    skills: "/admin/skills",
    projects: "/admin/projects",
    experience: "/admin/experience",
    architecture: "/admin/architecture",
    contact: "/admin/contact",
  };
  return routeMap[sectionType] || null;
}

/**
 * Valid section types
 */
export type SectionType =
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "architecture"
  | "contact"
  | "custom_static";
