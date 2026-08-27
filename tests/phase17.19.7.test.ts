import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");

describe("Phase 17.19.7 CMS experience hardening contracts", () => {
  it("keeps the Admin Shell composed of skip link, sidebar, top bar, main, and footer", async () => {
    const shell = await source("components/a3lam/AdminShell.tsx");
    expect(shell).toContain('href="#admin-main"');
    expect(shell).toContain("AdminSidebar");
    expect(shell).toContain("AdminTopBar");
    expect(shell).toContain('id="admin-main"');
    expect(shell).toContain("AdminFooter");
    expect(shell).toContain("AdminContent");
  });

  it("keeps mobile navigation accessible and stateful", async () => {
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(sidebar).toContain('aria-expanded={mobileOpen}');
    expect(sidebar).toContain('aria-controls="admin-primary-navigation"');
    expect(sidebar).toContain('aria-label={navigationLabel}');
    expect(sidebar).toContain('className="admin-sidebar-backdrop"');
  });

  it("returns focus after Escape and overlay close", async () => {
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(sidebar).toContain("toggleRef = useRef<HTMLButtonElement>");
    expect(sidebar).toContain("navigationRef = useRef<HTMLElement>");
    expect(sidebar).toContain("requestAnimationFrame(() => toggleRef.current?.focus())");
    expect(sidebar).toContain('if (event.key === "Escape") closeDrawer()');
  });

  it("keeps Content Hub state handling truthful and bounded", async () => {
    const hub = await source("app/admin/(protected)/content/page.tsx");
    const list = await source("components/a3lam/CmsEditorialList.tsx");
    expect(hub).toContain("loadWorkspaceSummary");
    expect(hub).toContain("adminCmsRequiresMigration");
    expect(list).toContain("AdminErrorState");
    expect(list).toContain("AdminUnavailableState");
    expect(list).toContain("admin-filter-form");
  });

  it("does not expose unavailable content as available in the registry", async () => {
    const registry = await source("lib/cms/contentRegistry.ts");
    expect(registry).toContain('availability: "requires_configuration"');
    expect(registry).toContain('editor: "unavailable"');
    expect(registry).toContain('"recent-posts": { id: "recent-posts", label: "أحدث المقالات", availability: "not_available"');
  });

  it("keeps Page editor server-gated and migration-aware", async () => {
    const page = await source("app/admin/(protected)/content/pages/[id]/page.tsx");
    expect(page).toContain('getAdminPageAccess("content.read")');
    expect(page).toContain("content.update");
    expect(page).toContain("CmsEditorialEditor");
    expect(page).toContain("adminCmsRequiresMigration");
  });

  it("keeps Post editor taxonomy and server capabilities explicit", async () => {
    const post = await source("app/admin/(protected)/content/posts/[id]/page.tsx");
    expect(post).toContain('getAdminPageAccess("content.read")');
    expect(post).toContain("loadTaxonomy");
    expect(post).toContain("content.review");
    expect(post).toContain("CmsEditorialEditor");
  });

  it("keeps Biography Editor sections schema-backed and keyboard-navigable", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(editor).toContain("admin-editor-outline");
    expect(editor).toContain("admin-basic-title");
    expect(editor).toContain("admin-biography-title");
    expect(editor).toContain("admin-education-title");
    expect(editor).toContain("admin-sources-title");
    expect(editor).not.toContain("admin-relationships-title");
  });

  it("keeps Media Picker safe, bounded, selectable, and cancellable", async () => {
    const picker = await source("components/a3lam/CmsMediaPicker.tsx");
    const route = await source("app/api/admin/media/picker/route.ts");
    expect(picker).toContain("showModal");
    expect(picker).toContain("onCancel={close}");
    expect(picker).toContain("useSelected");
    expect(route).toContain('limit: 50');
    expect(route).toContain('status: "ready"');
    expect(route).toContain('visibility: "public"');
    expect(route).not.toContain("storageKey");
  });

  it("keeps Revision Center explicit about current version and metadata-only diff limits", async () => {
    const center = await source("components/a3lam/CmsRevisionCenter.tsx");
    expect(center).toContain("currentVersion");
    expect(center).toContain("adminCmsRevisionMetadataOnly");
    expect(center).toContain("expectedVersion: currentVersion");
    expect(center).toContain("status === 409");
  });

  it("keeps Theme Registry deterministic and allowlisted", async () => {
    const registry = await source("lib/cms/themeRegistry.ts");
    expect(registry).toContain("Object.freeze");
    expect(registry).toContain('"single-page"');
    expect(registry).toContain('"single-post"');
    expect(registry).toContain('"category"');
    expect(registry).toContain('"tag"');
    expect(registry).not.toMatch(/eval\(|new Function|import\(/);
  });

  it("keeps SiteFrame as Header/Main/optional-sidebar/Footer composition", async () => {
    const frame = await source("components/a3lam/SiteFrame.tsx");
    expect(frame).toContain("SiteHeader");
    expect(frame).toContain("SiteFooter");
    expect(frame).toContain("site-frame-layout");
    expect(frame).toContain("has-sidebar");
    expect(frame).toContain('dir={context.direction}');
  });

  it("keeps RBAC server-side in the protected admin layout and APIs", async () => {
    const layout = await source("app/admin/(protected)/layout.tsx");
    const pagesApi = await source("app/api/admin/cms/pages/route.ts");
    const bulkApi = await source("app/api/admin/cms/pages/bulk/route.ts");
    expect(layout).toContain("requireAdminPage");
    expect(pagesApi).toContain("requirePermissionPrincipal");
    expect(bulkApi).toContain("requirePermissionPrincipal");
    expect(bulkApi).toContain("isSameOriginMutation");
  });

  it("keeps accessibility semantics localized and visible", async () => {
    const messages = await source("lib/i18n/messages.ts");
    const shell = await source("components/a3lam/AdminShell.tsx");
    const sidebar = await source("components/a3lam/AdminSidebar.tsx");
    expect(messages).toContain("adminSkipToContent");
    expect(messages).toContain("adminNavigationLabel");
    expect(shell).toContain('id="admin-main"');
    expect(sidebar).toContain("aria-current={current ? \"page\" : undefined}");
  });

  it("keeps responsive-safe and reduced-motion styles present", async () => {
    const css = await source("app/globals.css");
    expect(css).toContain("@media (max-width: 48rem)");
    expect(css).toContain("@media (max-width: 30rem)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("admin-skip-link:focus");
  });

  it("keeps AI production and publication flags disabled", async () => {
    const activation = await source("lib/ai/activation.ts");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
  });

  it("keeps the publication firewall on published-only public projections", async () => {
    const person = await source("lib/services/personService.ts");
    const page = await source("app/page/[slug]/page.tsx");
    const article = await source("app/article/[slug]/page.tsx");
    expect(person).toContain("getPublishedPersonBySlug");
    expect(page).toContain("getPublishedBySlug(\"page\", slug)");
    expect(article).toContain("getPublishedBySlug(\"post\", slug)");
  });

  it("keeps WordPress runtime and dependencies absent", async () => {
    const packageText = await source("package.json");
    const navigation = await source("lib/cms/adminNavigation.ts");
    expect(packageText).not.toMatch(/wordpress|wp-admin|gutenberg|php/i);
    expect(navigation).not.toMatch(/wordpress|wp-admin|PHP/i);
  });

  it("keeps dynamic imports allowlisted and non-user-controlled", async () => {
    const registry = await source("lib/cms/themeRegistry.ts");
    const renderer = await source("lib/cms/themeRenderer.ts");
    expect(registry).not.toMatch(/eval\(|new Function|Function\(/);
    expect(renderer).not.toMatch(/eval\(|new Function|Function\(/);
    expect(renderer).not.toMatch(/import\([^"'`]/);
  });

  it("keeps migration execution out of Phase 17.19.7 implementation paths", async () => {
    const editor = await source("components/a3lam/CmsEditorialEditor.tsx");
    const picker = await source("app/api/admin/media/picker/route.ts");
    const migrationApi = await source("app/api/admin/system/migrations/execute/route.ts");
    expect(editor).not.toContain("runMigrations");
    expect(picker).not.toContain("runMigrations");
    expect(migrationApi).not.toContain("CmsEditorialEditor");
  });
});
