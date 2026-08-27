import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { filterAdminNavigation, getAdminNavigation } from "@/lib/cms/adminNavigation";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { presentAdminMetric, toDashboardMetricView } from "@/lib/admin/dashboardView";
import { resolveThemeTemplate } from "@/lib/cms/themeRegistry";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");
const copy = getMessages(defaultLocale);

describe("Phase 17.19.5 CMS UX/UI contracts", () => {
  it("keeps the navigation registry authoritative and capability-filtered", () => {
    const navigation = getAdminNavigation(copy);
    expect(navigation.some((group) => group.id === "appearance")).toBe(true);
    expect(navigation.flatMap((group) => group.items).find((item) => item.id === "widgets")?.availability).toBe("not_available");
    const noPermissionNavigation = filterAdminNavigation(navigation, () => false);
    expect(noPermissionNavigation.some((group) => group.id === "dashboard")).toBe(true);
    expect(noPermissionNavigation.some((group) => group.id === "content")).toBe(false);
    expect(filterAdminNavigation(navigation, (permission) => permission === "people.read").flatMap((group) => group.items).map((item) => item.id)).toContain("people");
  });

  it("preserves server route protection and does not treat navigation hiding as authorization", async () => {
    const layout = await source("app/admin/(protected)/layout.tsx");
    const shell = await source("components/a3lam/AdminShell.tsx");
    expect(layout).toContain("requireAdminPage");
    expect(shell).toContain("effectivePermissionsForPrincipal");
    expect(shell).toContain("filterAdminNavigation");
  });

  it("keeps forbidden capability behavior on the server-side access boundary", async () => {
    const content = await source("app/admin/(protected)/content/page.tsx");
    const appearance = await source("components/a3lam/AdminSiteExperiencePage.tsx");
    expect(content).toContain("hasEffectiveAdminPermission");
    expect(appearance).toContain("siteExperienceAccess");
    expect(appearance).toContain("adminUnauthorized");
  });

  it("represents unknown dashboard metrics as an em dash rather than zero", () => {
    expect(presentAdminMetric(undefined)).toBe("—");
    expect(presentAdminMetric(null)).toBe("—");
    expect(presentAdminMetric(-1)).toBe("—");
    expect(presentAdminMetric(0)).toBe(0);
    expect(toDashboardMetricView({ label: "People", value: null, featured: true })).toEqual({ label: "People", displayValue: "—", featured: true });
  });

  it("uses the shared metric card and truthful dashboard values", async () => {
    const dashboard = await source("app/admin/(protected)/page.tsx");
    expect(dashboard).toContain("AdminMetricCard");
    expect(dashboard).toContain("toDashboardMetricView");
    expect(dashboard).not.toContain("summary?.people ?? 0");
  });

  it("provides a Content Hub loading boundary and truthful migration state", async () => {
    expect(existsSync(resolve(root, "app/admin/(protected)/content/loading.tsx"))).toBe(true);
    const content = await source("app/admin/(protected)/content/page.tsx");
    const loading = await source("app/admin/(protected)/content/loading.tsx");
    expect(content).toContain("adminCmsRequiresMigration");
    expect(loading).toContain("AdminLoadingState");
  });

  it("keeps editorial tables bounded, reusable, and free of fake rows", async () => {
    const list = await source("components/a3lam/CmsEditorialList.tsx");
    expect(list).toContain("data?.items");
    expect(list).toContain("adminCmsNoItems");
    expect(list).toContain("admin-table");
    expect(list).not.toContain("sample");
  });

  it("gives Biography Editor schema-backed sections a navigable outline", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(editor).toContain("admin-editor-outline");
    expect(editor).toContain("admin-basic-title");
    expect(editor).toContain("admin-sources-title");
    expect(editor).toContain("admin-timeline-title");
    expect(editor).toContain("admin-education-title");
    expect(editor).toContain("admin-save-state");
    expect(editor).not.toContain("fake");
  });

  it("keeps editor persistence truthfully server-backed and recovery distinct", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    const cmsEditor = await source("components/a3lam/CmsEditorialEditor.tsx");
    expect(editor).toContain("fetch(");
    expect(editor).toContain("adminSaving");
    expect(cmsEditor).toContain("localStorage");
    expect(cmsEditor).toContain("adminCmsSavedLocally");
    expect(cmsEditor).not.toContain("autosave");
  });

  it("keeps Media Library read-only for upload/provider activation and exposes honest states", async () => {
    const media = await source("components/a3lam/MediaLibraryClient.tsx");
    const picker = await source("components/a3lam/CmsMediaPicker.tsx");
    const route = await source("app/api/admin/media/picker/route.ts");
    expect(media).toContain("adminMediaNoProvider");
    expect(media).toContain("admin-media-view-toggle");
    expect(picker).toContain("showModal");
    expect(route).toContain('limit: 50');
    expect(route).toContain('status: "ready"');
    expect(route).toContain('visibility: "public"');
    expect(route).not.toContain("storageKey");
  });

  it("keeps Appearance surfaces typed and widgets explicitly unavailable", async () => {
    const appearance = await source("app/admin/(protected)/appearance/page.tsx");
    const registry = await source("lib/cms/contentRegistry.ts");
    expect(appearance).toContain("adminCmsWidgets");
    expect(appearance).toContain("adminUnavailable");
    expect(registry).toContain('id: "recent-people"');
    expect(registry).toContain('availability: "not_available"');
  });

  it("integrates SiteFrame with registered theme templates and shared parts", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    const registry = await source("lib/cms/themeRegistry.ts");
    expect(resolveThemeTemplate("category").template).toBe("category");
    expect(resolveThemeTemplate("search").template).toBe("search");
    expect(frame).toContain("SiteHeader");
    expect(frame).toContain("SiteFooter");
    expect(frame).toContain("site-frame-layout");
    expect(registry).toContain('layoutParts: ["header", "footer", "sidebar", "content"]');
  });

  it("uses SiteFrame on category and search projections without changing their public queries", async () => {
    const categories = await source("app/categories/page.tsx");
    const search = await source("app/search/page.tsx");
    expect(categories).toContain('<SiteFrame copy={copy} active="categories" template="category">');
    expect(search).toContain('<SiteFrame copy={publicCopy} active="search" template="search">');
    expect(categories).toContain("personService.listCategories");
    expect(search).toContain("SearchDiscovery");
  });

  it("provides keyboard and landmark semantics for the redesigned shell", async () => {
    const shell = await source("components/a3lam/AdminShell.tsx");
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    const css = await source("app/globals.css");
    expect(shell).toContain("admin-skip-link");
    expect(shell).toContain('id="admin-main"');
    expect(sidebar).toContain("Escape");
    expect(sidebar).toContain("admin-sidebar-backdrop");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("keeps responsive admin behavior bounded to CSS and does not require global state", async () => {
    const css = await source("app/globals.css");
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(css).toContain("admin-sidebar.is-mobile-open");
    expect(css).toContain("site-frame-layout.has-sidebar");
    expect(sidebar).not.toMatch(/redux|zustand|createStore/i);
  });

  it("preserves no raw HTML, publication firewall, and AI disabled boundaries", async () => {
    const renderer = await source("components/a3lam/CmsRichTextRenderer.tsx");
    const activation = await source("lib/ai/activation.ts");
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    expect(repository).toContain('eq(schema.cmsPages.status, "published")');
    expect(repository).toContain('eq(schema.cmsPosts.status, "published")');
  });

  it("does not introduce WordPress dependencies or migration/production mutation paths", async () => {
    const packageText = await source("package.json");
    const registry = await source("lib/cms/themeRegistry.ts");
    expect(packageText).not.toMatch(/wordpress|wp-api|php/i);
    expect(registry).not.toMatch(/wordpress|PHP/i);
    expect(existsSync(resolve(root, "drizzle/migrations/0011_phase17_19_5.sql"))).toBe(false);
    expect(await source("app/api/admin/media/picker/route.ts")).not.toMatch(/runMigrations|DATABASE_URL/);
  });

  it("includes loading boundaries for Media and Appearance as well as Content", async () => {
    for (const path of [
      "app/admin/(protected)/media/loading.tsx",
      "app/admin/(protected)/appearance/loading.tsx",
    ]) {
      expect(existsSync(resolve(root, path))).toBe(true);
      expect(await source(path)).toContain("AdminLoadingState");
    }
  });
});
