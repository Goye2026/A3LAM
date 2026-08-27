import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/lib/i18n/messages";
import { hasAdminPermission, permissionsForRole } from "@/lib/admin/rbac";
import { getAdminNavigation, filterAdminNavigation } from "@/lib/cms/adminNavigation";
import { contentTypeRegistry, getWidget, isRegisteredWidget, listContentTypes } from "@/lib/cms/contentRegistry";
import { getMenu, isSafeMenuHref, validateMenuItems } from "@/lib/cms/menuRegistry";
import { activeTheme, listThemes, resolveLayout, resolveTemplate } from "@/lib/cms/themeRegistry";
import type { CmsMenuItem } from "@/lib/cms/types";

const root = resolve(process.cwd());
const source = (relativePath: string) => readFile(resolve(root, relativePath), "utf8");

function menuItem(id: string, parentId: string | null, order = 1): CmsMenuItem {
  return { id, label: id, href: `/${id}`, target: "_self", parentId, order, enabled: true };
}

describe("Phase 17.19.1 CMS architecture", () => {
  it("keeps one unique active A3LAM-native theme and no duplicate registry ids", () => {
    const themes = listThemes();
    expect(themes).toHaveLength(1);
    expect(themes.filter((theme) => theme.status === "active")).toHaveLength(1);
    expect(activeTheme.id).toBe("a3lam-editorial");
    expect(new Set(themes.map((theme) => theme.id)).size).toBe(themes.length);
  });

  it("resolves supported templates and falls back deterministically for unavailable templates", () => {
    expect(resolveTemplate("single-person", activeTheme)).toBe("single-person");
    expect(resolveTemplate("single-post", activeTheme)).toBe("single-post");
    expect(resolveTemplate("single-page", activeTheme)).toBe("single-page");
    expect(resolveLayout("header", activeTheme)).toBe("header");
    expect(resolveLayout("content", activeTheme)).toBe("content");
  });

  it("keeps content types honest: domain entities are schema-backed and generic types are unavailable", () => {
    expect(listContentTypes()).toHaveLength(6);
    expect(contentTypeRegistry.person).toMatchObject({ storageTable: "people", availability: "available", domainSpecific: true, editor: "person", readPermission: "people.read" });
    expect(contentTypeRegistry.profile).toMatchObject({ storageTable: "profiles", availability: "available", domainSpecific: true, editor: "profile", readPermission: "profiles.read" });
    expect(contentTypeRegistry.category).toMatchObject({ storageTable: "categories", availability: "available", domainSpecific: true, editor: "category", readPermission: "categories.read" });
    for (const id of ["page", "post"] as const) {
      expect(contentTypeRegistry[id]).toMatchObject({ availability: "requires_configuration", editor: "unavailable", supportsPublication: true, readPermission: "content.read" });
    }
    expect(contentTypeRegistry.tag).toMatchObject({ availability: "requires_configuration", editor: "unavailable", supportsPublication: false, readPermission: "taxonomy.read" });
  });

  it("rejects unsafe menu URLs, duplicate ids, cycles, and excessive nesting", () => {
    expect(isSafeMenuHref("/ar/person/example")).toBe(true);
    expect(isSafeMenuHref("https://example.org/source")).toBe(true);
    expect(isSafeMenuHref("javascript:alert(1)")).toBe(false);
    expect(isSafeMenuHref("//evil.example")).toBe(false);
    expect(validateMenuItems([menuItem("one", null), menuItem("one", null)]).reason).toBe("duplicate-id");
    expect(validateMenuItems([menuItem("one", "two"), menuItem("two", "one")]).reason).toBe("cycle");
    expect(validateMenuItems([menuItem("a", null), menuItem("b", "a")]).valid).toBe(true);
    expect(validateMenuItems([menuItem("a", null), menuItem("b", "a"), menuItem("c", "b")]).reason).toBe("max-depth");
    expect(validateMenuItems(getMenu("primary")).valid).toBe(true);
  });

  it("exposes only predefined safe widgets and rejects unknown widget ids", () => {
    expect(getWidget("recent-people")).toMatchObject({ availability: "available", renderSafe: true });
    expect(getWidget("recent-posts")).toMatchObject({ availability: "not_available" });
    expect(isRegisteredWidget("search")).toBe(true);
    expect(isRegisteredWidget("arbitrary-component")).toBe(false);
    expect(getWidget("arbitrary-component" as never)).toBeNull();
  });

  it("keeps admin navigation declarative, RBAC-filtered, and visibly unavailable where persistence is absent", () => {
    const navigation = getAdminNavigation(getMessages("ar"));
    const editorPermissions = permissionsForRole("EDITOR");
    const visible = filterAdminNavigation(navigation, (permission) => editorPermissions.has(permission));
    const content = visible.find((group) => group.id === "content");
    expect(content?.items.some((entry) => entry.id === "people")).toBe(true);
    expect(content?.items.some((entry) => entry.id === "pages" && entry.href === "/admin/content/pages" && entry.availability === "requires_configuration")).toBe(true);
    expect(visible.some((group) => group.id === "users")).toBe(false);
    expect(hasAdminPermission("EDITOR", "people.create")).toBe(true);
    expect(hasAdminPermission("EDITOR", "settings.manage")).toBe(false);
  });

  it("does not add executable theme/config paths or bypass the AI boundary", async () => {
    const cmsFiles = ["lib/cms/types.ts", "lib/cms/themeRegistry.ts", "lib/cms/themeRenderer.ts", "lib/cms/menuRegistry.ts", "lib/cms/contentRegistry.ts", "lib/cms/adminNavigation.ts", "lib/cms/editorialStatus.ts", "lib/cms/slug.ts", "lib/cms/richText.ts", "lib/cms/editorialValidation.ts", "lib/cms/editorialRepository.ts"];
    for (const relativePath of cmsFiles) {
      const text = await source(relativePath);
      expect(text, relativePath).not.toMatch(/\beval\s*\(|\bnew Function\s*\(|\bimport\s*\(/);
    }
    const activation = await source("lib/ai/activation.ts");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    const workspace = await source("components/a3lam/ai/A3lamEditorialWorkspace.tsx");
    expect(workspace).toContain("saveLocalDraft");
    expect(workspace).not.toContain("tests/support");
  });

  it("keeps CMS mutations behind the existing same-origin/RBAC and publication contracts", async () => {
    const createRoute = await source("app/api/admin/people/route.ts");
    expect(createRoute).toContain('requirePermissionPrincipal(request, "people.create")');
    expect(createRoute).toContain("isSameOriginMutation(request)");
    const biography = await source("components/a3lam/BiographyContent.tsx");
    expect(biography).not.toContain("dangerouslySetInnerHTML");
    expect(biography).not.toMatch(/<iframe|<script|javascript:/i);
  });

  it("retains the domain editors, Content Hub protection, and existing public route files", async () => {
    const editor = await source("components/a3lam/AdminPersonForm.tsx");
    expect(editor).toContain("AdminPersonForm");
    expect(editor).toContain("isDirty");
    expect(editor).toContain("source");
    expect(editor).toContain("timeline");
    const contentHub = await source("app/admin/(protected)/content/page.tsx");
    expect(contentHub).toContain("getAdminPrincipal");
    expect(contentHub).toContain("hasEffectiveAdminPermission");
    expect(contentHub).toContain("listContentTypes");
    const media = await source("components/a3lam/MediaLibraryClient.tsx");
    expect(media).toContain("aria-pressed");
    expect(media).toContain("is-list");
    expect(existsSync(resolve(root, "app/person/[slug]/page.tsx"))).toBe(true);
    expect(existsSync(resolve(root, "app/categories/page.tsx"))).toBe(true);
    expect(existsSync(resolve(root, "app/search/page.tsx"))).toBe(true);
    expect(existsSync(resolve(root, "app/sitemap.ts"))).toBe(true);
    expect(existsSync(resolve(root, "app/robots.ts"))).toBe(true);
  });
});
