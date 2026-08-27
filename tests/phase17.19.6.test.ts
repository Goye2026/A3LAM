import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");

describe("Phase 17.19.6 visual QA hardening contracts", () => {
  it("returns mobile drawer focus to its toggle after Escape/close", async () => {
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(sidebar).toContain("toggleRef = useRef<HTMLButtonElement>");
    expect(sidebar).toContain("navigationRef = useRef<HTMLElement>");
    expect(sidebar).toContain("requestAnimationFrame(() => toggleRef.current?.focus())");
    expect(sidebar).toContain("if (event.key === \"Escape\") closeDrawer()");
  });

  it("keeps the drawer open button and overlay semantically named", async () => {
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(sidebar).toContain('aria-expanded={mobileOpen}');
    expect(sidebar).toContain('aria-controls="admin-primary-navigation"');
    expect(sidebar).toContain('className="admin-sidebar-backdrop"');
    expect(sidebar).toContain('aria-label={closeLabel}');
  });

  it("keeps the shell landmark and skip link localized", async () => {
    const shell = await source("components/a3lam/AdminShell.tsx");
    const messages = await source("lib/i18n/messages.ts");
    expect(shell).toContain('href="#admin-main"');
    expect(shell).toContain('id="admin-main"');
    expect(messages).toContain("adminSkipToContent");
    expect(messages).toContain("adminNavigationLabel");
  });

  it("keeps public category and search composition on the shared SiteFrame", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    const categories = await source("app/categories/page.tsx");
    const search = await source("app/search/page.tsx");
    expect(frame).toContain("SiteHeader");
    expect(frame).toContain("SiteFooter");
    expect(frame).toContain("site-frame-layout");
    expect(categories).toContain('template="category"');
    expect(search).toContain('template="search"');
  });

  it("preserves RTL as the default SiteFrame direction and keeps LTR fields explicit", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(frame).toContain('createRenderContext(template, "ar")');
    expect(frame).toContain('dir={context.direction}');
    expect(editor).toContain('dir="ltr"');
  });

  it("keeps public error and unavailable states user-readable without internals", async () => {
    const person = await source("app/person/[slug]/page.tsx");
    const list = await source("components/a3lam/CmsEditorialList.tsx");
    expect(person).toContain("personService.getPublishedPersonBySlug");
    expect(person).toContain("notFound()");
    expect(list).toContain("AdminErrorState");
    expect(list).toContain("AdminUnavailableState");
    expect(list).not.toContain("DATABASE_URL");
    expect(list).not.toContain("stack trace");
  });

  it("keeps Media Picker bounded, cancellable, and private-field free", async () => {
    const picker = await source("components/a3lam/CmsMediaPicker.tsx");
    const route = await source("app/api/admin/media/picker/route.ts");
    expect(picker).toContain('ref={dialogRef}');
    expect(picker).toContain('onCancel={close}');
    expect(picker).toContain("adminCmsMediaCancel");
    expect(route).toContain('limit: 50');
    expect(route).toContain('status: "ready"');
    expect(route).toContain('visibility: "public"');
    expect(route).not.toContain("storageKey");
  });

  it("keeps Biography Editor navigation limited to supported editorial sections", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(editor).toContain("admin-editor-outline");
    for (const id of ["admin-basic-title", "admin-biography-title", "admin-categories-title", "admin-sources-title", "admin-timeline-title", "admin-education-title", "admin-readiness-title"]) {
      expect(editor).toContain(`#${id}`);
    }
    expect(editor).not.toContain("admin-relationships-title");
  });

  it("keeps local recovery distinct from server save and autosave claims", async () => {
    const recovery = await source("components/a3lam/CmsEditorialEditor.tsx");
    expect(recovery).toContain("localStorage");
    expect(recovery).toContain("adminCmsSavedLocally");
    expect(recovery).not.toContain("Autosaved");
    expect(recovery).not.toContain("server autosave");
  });

  it("keeps dashboard unknown metrics truthful", async () => {
    const dashboard = await source("app/admin/(protected)/page.tsx");
    const metric = await source("lib/admin/dashboardView.ts");
    expect(dashboard).toContain("toDashboardMetricView");
    expect(metric).toContain('return typeof value === "number"');
    expect(metric).toContain(': "—"');
  });

  it("keeps Appearance unavailable controls explicit rather than fake", async () => {
    const appearance = await source("app/admin/(protected)/appearance/page.tsx");
    expect(appearance).toContain("adminCmsWidgets");
    expect(appearance).toContain("adminUnavailable");
    expect(appearance).not.toMatch(/Upload Theme|Install Plugin|Add Widget/);
  });

  it("keeps CSS responsive and reduced-motion aware", async () => {
    const css = await source("app/globals.css");
    expect(css).toContain("admin-sidebar.is-mobile-open");
    expect(css).toContain("site-frame-layout.has-sidebar");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("admin-skip-link:focus");
  });

  it("preserves server-side auth/RBAC and publication/AI boundaries", async () => {
    const layout = await source("app/admin/(protected)/layout.tsx");
    const shell = await source("components/a3lam/AdminShell.tsx");
    const activation = await source("lib/ai/activation.ts");
    const renderer = await source("components/a3lam/CmsRichTextRenderer.tsx");
    expect(layout).toContain("requireAdminPage");
    expect(shell).toContain("effectivePermissionsForPrincipal");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
  });

  it("does not add migrations, WordPress runtime, or production mutation paths", async () => {
    const packageText = await source("package.json");
    const picker = await source("app/api/admin/media/picker/route.ts");
    expect(packageText).not.toMatch(/wordpress|wp-api|php/i);
    expect(picker).not.toMatch(/runMigrations|DATABASE_URL/);
    expect(await source("lib/cms/themeRegistry.ts")).not.toMatch(/wordpress|PHP/i);
  });
});
