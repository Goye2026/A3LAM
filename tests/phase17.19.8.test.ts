import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { presentAdminMetric, toDashboardMetricView } from "@/lib/admin/dashboardView";
import { getContentType, getWidget, listContentTypes } from "@/lib/cms/contentRegistry";
import { getTheme, listThemes, resolveLayout, resolveThemeTemplate } from "@/lib/cms/themeRegistry";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");

describe("Phase 17.19.8 CMS UX and frontend foundation contracts", () => {
  it("presents only finite non-negative dashboard metrics", () => {
    expect(presentAdminMetric(12)).toBe(12);
    expect(presentAdminMetric(undefined)).toBe("—");
    expect(presentAdminMetric(Number.NaN)).toBe("—");
    expect(presentAdminMetric(-1)).toBe("—");
  });

  it("creates typed dashboard metric views without inventing values", () => {
    expect(toDashboardMetricView({ label: "People", value: null, featured: true })).toEqual({ label: "People", displayValue: "—", featured: true });
    expect(toDashboardMetricView({ label: "Categories", value: 4 })).toEqual({ label: "Categories", displayValue: 4, featured: false });
  });

  it("keeps Admin Shell composition centralized", async () => {
    const shell = await source("components/a3lam/AdminShell.tsx");
    expect(shell).toContain("AdminSidebar");
    expect(shell).toContain("AdminTopBar");
    expect(shell).toContain("AdminHeader");
    expect(shell).toContain("AdminContent");
    expect(shell).toContain("AdminFooter");
  });

  it("keeps navigation active state, filtering, and unavailable status in one registry", async () => {
    const navigation = await source("lib/cms/adminNavigation.ts");
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(navigation).toContain("filterAdminNavigation");
    expect(navigation).toContain('availability: CmsAdminNavItem["availability"]');
    expect(sidebar).toContain("isCurrentPath");
    expect(sidebar).toContain("is-disabled");
  });

  it("filters CMS content types according to their truthful availability", () => {
    expect(getContentType("page").availability).toBe("requires_configuration");
    expect(getContentType("post").availability).toBe("requires_configuration");
    expect(getContentType("category").availability).toBe("available");
    expect(listContentTypes().some((item) => item.id === "tag")).toBe(true);
  });

  it("keeps widgets explicitly marked when persistence is unavailable", () => {
    expect(getWidget("recent-posts")?.availability).toBe("not_available");
    expect(getWidget("categories")?.availability).toBe("available");
    expect(getWidget("custom-text")?.availability).toBe("planned");
  });

  it("keeps Content Hub search, filters, pagination, and truthful states", async () => {
    const hub = await source("app/admin/(protected)/content/page.tsx");
    const list = await source("components/a3lam/CmsEditorialList.tsx");
    expect(hub).toContain("loadWorkspaceSummary");
    expect(hub).toContain("adminCmsRequiresMigration");
    expect(list).toContain("admin-filter-form");
    expect(list).toContain("AdminErrorState");
    expect(list).toContain("AdminUnavailableState");
  });

  it("keeps Pages editor server-gated and migration-aware", async () => {
    const page = await source("app/admin/(protected)/content/pages/[id]/page.tsx");
    expect(page).toContain('getAdminPageAccess("content.read")');
    expect(page).toContain("CmsEditorialEditor");
    expect(page).toContain("content.update");
    expect(page).toContain("adminCmsRequiresMigration");
  });

  it("keeps Posts editor taxonomy explicit and shared with Pages editor", async () => {
    const post = await source("app/admin/(protected)/content/posts/[id]/page.tsx");
    const editor = await source("components/a3lam/CmsEditorialEditor.tsx");
    expect(post).toContain("loadTaxonomy");
    expect(post).toContain("CmsEditorialEditor");
    expect(editor).toContain("categoryIds");
    expect(editor).toContain("tagIds");
  });

  it("keeps Biography Editor domain-specific and limited to supported sections", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(editor).toContain("admin-editor-outline");
    for (const id of ["admin-basic-title", "admin-biography-title", "admin-categories-title", "admin-sources-title", "admin-timeline-title", "admin-education-title", "admin-readiness-title"]) {
      expect(editor).toContain(`#${id}`);
    }
    expect(editor).not.toContain("admin-relationships-title");
  });

  it("keeps editor states distinct for server save, local recovery, and unsaved work", async () => {
    const editor = await source("components/a3lam/CmsEditorialEditor.tsx");
    expect(editor).toContain("localStorage");
    expect(editor).toContain("adminCmsSavedLocally");
    expect(editor).toContain("adminCmsUnsaved");
    expect(editor).not.toContain("Autosaved");
  });

  it("keeps Revision Center stale-safe and explicit about current version", async () => {
    const center = await source("components/a3lam/CmsRevisionCenter.tsx");
    expect(center).toContain("currentVersion");
    expect(center).toContain("adminCmsRevisionMetadataOnly");
    expect(center).toContain("expectedVersion: currentVersion");
    expect(center).toContain("status === 409");
  });

  it("keeps Media Picker eligible-only and private-field free", async () => {
    const picker = await source("components/a3lam/CmsMediaPicker.tsx");
    const route = await source("app/api/admin/media/picker/route.ts");
    expect(picker).toContain("showModal");
    expect(picker).toContain("onCancel={close}");
    expect(picker).toContain("selected");
    expect(route).toContain('limit: 50');
    expect(route).toContain('status: "ready"');
    expect(route).toContain('visibility: "public"');
    expect(route).not.toContain("storageKey");
  });

  it("keeps Theme Registry allowlisted and resolves unsupported templates safely", () => {
    const theme = getTheme();
    expect(listThemes()).toHaveLength(1);
    expect(theme.status).toBe("active");
    expect(resolveThemeTemplate("single-page").template).toBe("single-page");
    expect(resolveThemeTemplate("not-found").template).toBe("not-found");
    expect(resolveLayout("header")).toBe("header");
  });

  it("keeps SiteFrame as the shared public chrome composition", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    expect(frame).toContain("SiteHeader");
    expect(frame).toContain("SiteFooter");
    expect(frame).toContain("site-frame-layout");
    expect(frame).toContain("site-frame-main");
  });

  it("removes duplicate public chrome from InfoPage by using SiteFrame", async () => {
    const info = await source("components/a3lam/InfoPage.tsx");
    expect(info).toContain('import { SiteFrame } from "./SiteFrame"');
    expect(info).toContain('<SiteFrame copy={copy} active={active} template="single-page">');
    expect(info).not.toContain("SiteHeader");
    expect(info).not.toContain("SiteFooter");
  });

  it("keeps public routes on published-only projections and preserves metadata routes", async () => {
    const page = await source("app/page/[slug]/page.tsx");
    const article = await source("app/article/[slug]/page.tsx");
    const sitemap = await source("app/sitemap.ts");
    expect(page).toContain("getPublishedBySlug(\"page\", slug)");
    expect(article).toContain("getPublishedBySlug(\"post\", slug)");
    expect(sitemap).toContain("listPublishedForSitemap");
  });

  it("keeps RTL semantics and explicit LTR fields", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(frame).toContain('dir={context.direction}');
    expect(frame).toContain('createRenderContext(template, "ar")');
    expect(editor).toContain('dir="ltr"');
  });

  it("keeps responsive CSS, overflow containment, and reduced motion", async () => {
    const css = await source("app/globals.css");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (max-width: 51.99rem)");
    expect(css).toContain("@media (max-width: 36rem)");
  });

  it("keeps accessibility primitives visible and localized", async () => {
    const shell = await source("components/a3lam/AdminShell.tsx");
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    const messages = await source("lib/i18n/messages.ts");
    expect(shell).toContain('href="#admin-main"');
    expect(sidebar).toContain("aria-expanded={mobileOpen}");
    expect(sidebar).toContain('aria-controls="admin-primary-navigation"');
    expect(messages).toContain("adminSkipToContent");
    expect(messages).toContain("adminNavigationLabel");
  });

  it("keeps AI disabled and publication boundaries server-side", async () => {
    const activation = await source("lib/ai/activation.ts");
    const layout = await source("app/admin/(protected)/layout.tsx");
    const renderer = await source("components/a3lam/CmsRichTextRenderer.tsx");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    expect(layout).toContain("requireAdminPage");
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps WordPress/PHP architecture and migration execution absent", async () => {
    const packageText = await source("package.json");
    const info = await source("components/a3lam/InfoPage.tsx");
    const picker = await source("app/api/admin/media/picker/route.ts");
    expect(packageText).not.toMatch(/wordpress|wp-admin|gutenberg|php/i);
    expect(info).not.toMatch(/\.php|wordpress/i);
    expect(picker).not.toMatch(/runMigrations|DATABASE_URL/);
  });
});
