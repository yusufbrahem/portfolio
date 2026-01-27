/**
 * Section templates — each menu uses a template to create its own section instance.
 * Template names use the _template suffix.
 */
export const SECTION_TEMPLATES_WITH_EDITORS = new Set([
  "about_template",
  "skills_template",
  "projects_template",
  "experience_template",
  "architecture_template",
  "contact_template",
]);

/** Template option for platform menu create/edit */
export const SECTION_TEMPLATE_OPTIONS: Array<{ value: SectionTemplate; label: string; hasEditor: boolean }> = [
  { value: "about_template", label: "About", hasEditor: true },
  { value: "skills_template", label: "Skills", hasEditor: true },
  { value: "projects_template", label: "Projects", hasEditor: true },
  { value: "experience_template", label: "Experience", hasEditor: true },
  { value: "architecture_template", label: "Architecture", hasEditor: true },
  { value: "contact_template", label: "Contact", hasEditor: true },
  { value: "custom_static", label: "Custom Static (No Editor)", hasEditor: false },
];

export type SectionTemplate =
  | "about_template"
  | "skills_template"
  | "projects_template"
  | "experience_template"
  | "architecture_template"
  | "contact_template"
  | "custom_static";

/**
 * Legacy: section types (no _template suffix) for backward compatibility during migration.
 * Prefer sectionTemplate everywhere.
 */
export const SECTION_TYPES_WITH_EDITORS = new Set([
  "about",
  "skills",
  "projects",
  "experience",
  "architecture",
  "contact",
  "about_template",
  "skills_template",
  "projects_template",
  "experience_template",
  "architecture_template",
  "contact_template",
]);

/**
 * Check if a section type or template has an admin editor
 */
export function hasSectionEditor(sectionTypeOrTemplate: string): boolean {
  return SECTION_TYPES_WITH_EDITORS.has(sectionTypeOrTemplate) || SECTION_TEMPLATES_WITH_EDITORS.has(sectionTypeOrTemplate);
}

/**
 * Normalize to template form (e.g. "experience" -> "experience_template")
 */
export function toSectionTemplate(sectionTypeOrTemplate: string): SectionTemplate | null {
  if (SECTION_TEMPLATE_OPTIONS.some((o) => o.value === sectionTypeOrTemplate)) {
    return sectionTypeOrTemplate as SectionTemplate;
  }
  const withSuffix = `${sectionTypeOrTemplate.replace(/_template$/, "")}_template`;
  if (SECTION_TEMPLATE_OPTIONS.some((o) => o.value === withSuffix)) {
    return withSuffix as SectionTemplate;
  }
  return null;
}

/**
 * Get admin route for a section type or template (legacy: one route per template kind).
 * For one-entry-per-menu routing use getAdminRouteByMenuKey(menuKey) instead.
 */
export function getSectionAdminRoute(sectionTypeOrTemplate: string): string | null {
  const t = toSectionTemplate(sectionTypeOrTemplate) || sectionTypeOrTemplate;
  const routeMap: Record<string, string> = {
    about: "/admin/about",
    about_template: "/admin/about",
    skills: "/admin/skills",
    skills_template: "/admin/skills",
    projects: "/admin/projects",
    projects_template: "/admin/projects",
    experience: "/admin/experience",
    experience_template: "/admin/experience",
    architecture: "/admin/architecture",
    architecture_template: "/admin/architecture",
    contact: "/admin/contact",
    contact_template: "/admin/contact",
  };
  return routeMap[t] || null;
}

/**
 * Canonical menu keys that have a fixed admin route and editor.
 * Only these keys are linked in the admin sidebar; other menus are metadata-only (no editor yet).
 */
export const CANONICAL_ADMIN_MENU_KEYS = new Set([
  "skills",
  "projects",
  "experience",
  "about",
  "architecture",
  "contact",
]);

/** Fixed admin routes only. No dynamic /admin/sections/*. */
export const CANONICAL_ADMIN_ROUTES: Record<string, string> = {
  skills: "/admin/skills",
  projects: "/admin/projects",
  experience: "/admin/experience",
  about: "/admin/about",
  architecture: "/admin/architecture",
  contact: "/admin/contact",
};

export const NO_EDITOR_MESSAGE =
  "This section is defined by the platform but does not have an editor yet.";

/** True only for menu keys that have an implemented admin editor (fixed routes). */
export function hasCanonicalEditor(menuKey: string): boolean {
  return CANONICAL_ADMIN_MENU_KEYS.has(menuKey);
}

/**
 * Admin route for a specific menu (one entry per menu).
 * @deprecated Use fixed CANONICAL_ADMIN_ROUTES only; do not route to /admin/sections/*.
 */
export function getAdminRouteByMenuKey(menuKey: string): string {
  return `/admin/sections/${encodeURIComponent(menuKey)}`;
}

/**
 * @deprecated Use SectionTemplate
 */
export type SectionType =
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "architecture"
  | "contact"
  | "custom_static";
