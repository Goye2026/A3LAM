import type { CmsRenderContext, CmsTemplateId } from "./types";
import { resolveThemeTemplate } from "./themeRegistry";

export function createRenderContext(
  requestedTemplate: CmsTemplateId,
  locale: "ar" | "en" = "ar",
  themeId?: "a3lam-editorial",
): CmsRenderContext {
  const resolved = resolveThemeTemplate(requestedTemplate, themeId);
  return {
    theme: resolved.theme,
    template: resolved.template,
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
  };
}

export function resolveSafeTemplate(requestedTemplate: CmsTemplateId, themeId?: "a3lam-editorial"): CmsTemplateId {
  return createRenderContext(requestedTemplate, "ar", themeId).template;
}
