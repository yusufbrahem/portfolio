/**
 * UI component types that can be added to a menu.
 * Menus are pages composed of these existing UI components.
 * No section templates; no free-text component creation.
 */

export const UI_COMPONENT_KEYS = [
  "title",
  "subtitle",
  "rich_text",
  "pill_list",
  "card_grid",
  "timeline",
  "pillar_card",
  "contact_block",
  "file_link",
] as const;

export type UIComponentKey = (typeof UI_COMPONENT_KEYS)[number];

export interface UIComponentDef {
  key: UIComponentKey;
  label: string;
  description: string;
}

export const UI_COMPONENT_REGISTRY: UIComponentDef[] = [
  { key: "title", label: "Title / Headline", description: "Section title or headline" },
  { key: "subtitle", label: "Subtitle / Intro", description: "Intro or subtitle text" },
  { key: "rich_text", label: "Rich text", description: "Formatted body content" },
  { key: "pill_list", label: "Pill / Tag list", description: "List of pills or tags" },
  { key: "card_grid", label: "Card grid", description: "Grid of cards (e.g. projects)" },
  { key: "timeline", label: "Timeline item", description: "Timeline or experience entry" },
  { key: "pillar_card", label: "Pillar / Feature card", description: "Title + description card" },
  { key: "contact_block", label: "Contact block", description: "Email, phone, links" },
  { key: "file_link", label: "File / Link", description: "File upload or external link (e.g. certificate)" },
];

const keySet = new Set<string>(UI_COMPONENT_KEYS);

export function isValidUIComponentKey(key: string): key is UIComponentKey {
  return keySet.has(key);
}

export function getUIComponentDef(key: string): UIComponentDef | null {
  return UI_COMPONENT_REGISTRY.find((c) => c.key === key) ?? null;
}
