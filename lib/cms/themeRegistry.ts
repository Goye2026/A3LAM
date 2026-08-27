import type { CmsLayoutPartId, CmsThemeDefinition, CmsTemplateId, CmsTemplateResolver } from "./types";

const A3LAM_THEME: CmsThemeDefinition = Object.freeze({
  id: "a3lam-editorial",
  name: "A3LAM Editorial",
  version: "1.0.0",
  author: "A3LAM",
  status: "active",
  templates: ["index", "single-person", "archive", "search", "not-found"] as const,
  layoutParts: ["header", "footer", "sidebar", "content"] as const,
  capabilities: ["rtl", "ltr-ready", "seo", "responsive", "server-rendered"] as const,
  settingsResource: "appearance",
});

const THEME_REGISTRY: Readonly<Record<CmsThemeDefinition["id"], CmsThemeDefinition>> = Object.freeze({
  [A3LAM_THEME.id]: A3LAM_THEME,
});

export const activeTheme: CmsThemeDefinition = THEME_REGISTRY[A3LAM_THEME.id];

export function getTheme(themeId: CmsThemeDefinition["id"] = activeTheme.id): CmsThemeDefinition {
  return THEME_REGISTRY[themeId] ?? activeTheme;
}

export function listThemes(): readonly CmsThemeDefinition[] {
  return Object.values(THEME_REGISTRY);
}

export const resolveTemplate: CmsTemplateResolver = (requested, theme) => {
  if (theme.templates.includes(requested)) return requested;
  if (requested === "single-post" || requested === "single-page") return "not-found";
  return theme.templates.includes("index") ? "index" : "not-found";
};

export function resolveLayout(part: CmsLayoutPartId, theme: CmsThemeDefinition = activeTheme): CmsLayoutPartId {
  return theme.layoutParts.includes(part) ? part : "content";
}

export function resolveThemeTemplate(requested: CmsTemplateId, themeId?: CmsThemeDefinition["id"]) {
  const theme = getTheme(themeId);
  return { theme, template: resolveTemplate(requested, theme) } as const;
}
