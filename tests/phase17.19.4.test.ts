import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCmsBulkStatusInput, parseCmsRevisionRestoreInput } from "@/lib/cms/editorialValidation";
import { canTransitionCmsEditorialStatus } from "@/lib/cms/editorialStatus";
import { filterAdminNavigation, getAdminNavigation } from "@/lib/cms/adminNavigation";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { resolveThemeTemplate } from "@/lib/cms/themeRegistry";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");
const copy = getMessages(defaultLocale);

function bulkPayload(count = 2) {
  const ids = Array.from({ length: count }, (_, index) => `id-${index + 1}`);
  return { ids, status: "review", expectedVersions: Object.fromEntries(ids.map((id) => [id, 1])) };
}

describe("Phase 17.19.4 editorial workspace contracts", () => {
  it("keeps the existing navigation registry authoritative and filters by permission", () => {
    const navigation = getAdminNavigation(copy);
    const content = navigation.find((group) => group.id === "content");
    expect(content?.items.some((item) => item.id === "pages" && item.availability === "requires_configuration")).toBe(true);
    expect(content?.items.some((item) => item.id === "posts" && item.availability === "requires_configuration")).toBe(true);
    expect(filterAdminNavigation(navigation, () => false).some((group) => group.id === "content")).toBe(false);
    expect(navigation.flatMap((group) => group.items).find((item) => item.id === "widgets")?.href).toBeNull();
  });

  it("preserves bounded content filters and pagination contracts", async () => {
    const pages = await source("app/admin/(protected)/content/pages/page.tsx");
    const posts = await source("app/admin/(protected)/content/posts/page.tsx");
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(pages).toContain('getAdminPageAccess("content.read")');
    expect(posts).toContain('getAdminPageAccess("content.read")');
    expect(repository).toContain("pageSize: Math.min(Math.max(options.pageSize ?? 20, 1), 50)");
    expect(repository).toContain("options.authorId");
    expect(repository).toContain("limit(10_000)");
  });

  it("validates bounded bulk requests and rejects duplicates or excessive batches", async () => {
    expect(parseCmsBulkStatusInput(bulkPayload())).toMatchObject({ ids: ["id-1", "id-2"], status: "review" });
    expect(() => parseCmsBulkStatusInput({ ...bulkPayload(), ids: ["id-1", "id-1"], expectedVersions: { "id-1": 1 } })).toThrow("unique");
    expect(() => parseCmsBulkStatusInput({ ...bulkPayload(51), expectedVersions: Object.fromEntries(Array.from({ length: 51 }, (_, index) => [`id-${index + 1}`, 1])) })).toThrow("invalid size");
    expect(() => parseCmsBulkStatusInput({ ...bulkPayload(), status: "published" })).not.toThrow();
    expect(await source("lib/cms/editorialRepository.ts")).toContain("Bulk publication or scheduling is not available");
  });

  it("keeps bulk transitions permission-aware and transition-aware", async () => {
    expect(canTransitionCmsEditorialStatus("draft", "review")).toBe(true);
    expect(canTransitionCmsEditorialStatus("published", "review")).toBe(false);
    for (const path of ["app/api/admin/cms/pages/bulk/route.ts", "app/api/admin/cms/posts/bulk/route.ts"]) {
      const text = await source(path);
      expect(text).toContain("requirePermissionPrincipal");
      expect(text).toContain("isSameOriginMutation");
      expect(text).toContain("readBoundedJson");
      expect(text).toContain("permissionForBulkStatus");
    }
  });

  it("supports truthful local recovery rather than fake server autosave", async () => {
    const editor = await source("components/a3lam/CmsEditorialEditor.tsx");
    expect(editor).toContain("localStorage");
    expect(editor).toContain("beforeunload");
    expect(editor).toContain("adminCmsSavedLocally");
    expect(editor).toContain("adminCmsRecoveryAvailable");
    expect(editor).not.toContain("autosave");
  });

  it("keeps Media Picker read-only, bounded, and free of upload/provider behavior", async () => {
    expect(existsSync(resolve(root, "components/a3lam/CmsMediaPicker.tsx"))).toBe(true);
    const picker = await source("components/a3lam/CmsMediaPicker.tsx");
    const route = await source("app/api/admin/media/picker/route.ts");
    expect(route).toContain('status: "ready"');
    expect(route).toContain('visibility: "public"');
    expect(route).toContain("limit: 50");
    expect(route).not.toContain("putObject");
    expect(route).not.toContain("storageKey");
    expect(picker).toContain("showModal");
    expect(picker).toContain("onSelect");
  });

  it("validates featured media and rich-text media references server-side", async () => {
    const validation = await source("lib/cms/editorialValidation.ts");
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(validation).toContain("featuredMediaId");
    expect(repository).toContain("featuredMediaExists");
    expect(repository).toContain('eq(schema.mediaAssets.visibility, "public")');
    expect(repository).toContain("mediaIdsFromDocument");
  });

  it("provides revision list/detail/restore routes and stale restore protection", async () => {
    expect(parseCmsRevisionRestoreInput({ revisionId: "revision-1", expectedVersion: 2 })).toEqual({ revisionId: "revision-1", expectedVersion: 2 });
    expect(() => parseCmsRevisionRestoreInput({ revisionId: "revision-1", expectedVersion: 0 })).toThrow("expectedVersion");
    for (const path of ["app/api/admin/cms/pages/[id]/revisions/route.ts", "app/api/admin/cms/pages/[id]/revisions/[revisionId]/route.ts", "app/api/admin/cms/posts/[id]/revisions/route.ts", "app/api/admin/cms/posts/[id]/revisions/[revisionId]/route.ts"]) {
      const text = await source(path);
      expect(text).toContain("requirePermissionPrincipal");
      expect(text).toContain("no-store");
    }
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(repository).toContain("listRevisions");
    expect(repository).toContain("restoreRevision");
    expect(repository).toContain("assertExpectedVersion");
    expect(repository).toContain('"restore_revision"');
  });

  it("marks current revision and protects restore with permission and same-origin", async () => {
    const center = await source("components/a3lam/CmsRevisionCenter.tsx");
    const pageRoute = await source("app/api/admin/cms/pages/[id]/revisions/route.ts");
    expect(center).toContain("isCurrent");
    expect(center).toContain("window.confirm");
    expect(center).toContain("canRestore");
    expect(pageRoute).toContain('"content.update"');
    expect(pageRoute).toContain("isSameOriginMutation");
  });

  it("strengthens theme templates without WordPress or dynamic execution", async () => {
    expect(resolveThemeTemplate("single-page").template).toBe("single-page");
    expect(resolveThemeTemplate("single-post").template).toBe("single-post");
    expect(resolveThemeTemplate("category").template).toBe("category");
    expect(resolveThemeTemplate("tag").template).toBe("tag");
    const registry = await source("lib/cms/themeRegistry.ts");
    expect(registry).not.toMatch(/wordpress|PHP/i);
    expect(registry).not.toMatch(/eval\s*\(|new Function\s*\(/);
  });

  it("uses typed view models in public CMS routes and preserves published-only projection", async () => {
    const contracts = await source("lib/cms/templateContracts.ts");
    const page = await source("app/page/[slug]/page.tsx");
    const article = await source("app/article/[slug]/page.tsx");
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(contracts).toContain("CmsPageViewModel");
    expect(contracts).toContain("CmsPostViewModel");
    expect(page).toContain("toCmsEditorialViewModel");
    expect(article).toContain("toCmsEditorialViewModel");
    expect(repository).toContain('eq(schema.cmsPages.status, "published")');
    expect(repository).toContain('eq(schema.cmsPosts.status, "published")');
  });

  it("does not expose media identifiers or dangerous executable HTML in public renderer", async () => {
    const renderer = await source("components/a3lam/CmsRichTextRenderer.tsx");
    const richText = await source("lib/cms/richText.ts");
    expect(renderer).toContain("cms-media-placeholder");
    expect(renderer).not.toContain("block.mediaId}");
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
    expect(richText).toContain("must not contain raw HTML");
    expect(richText).toContain("safeHref");
    expect(richText).not.toMatch(/<iframe|<script/i);
  });

  it("keeps authentication, RBAC, same-origin, and bounded-body barriers on new mutations", async () => {
    const routes = ["app/api/admin/cms/pages/bulk/route.ts", "app/api/admin/cms/posts/bulk/route.ts", "app/api/admin/cms/pages/[id]/revisions/route.ts", "app/api/admin/cms/posts/[id]/revisions/route.ts"];
    for (const path of routes) {
      const text = await source(path);
      expect(text).toContain("requirePermissionPrincipal");
      expect(text).toContain("isSameOriginMutation");
      expect(text).toContain("adminErrorResponse");
    }
    expect(await source("lib/admin/requestBody.ts")).toContain("DEFAULT_MAX_JSON_BYTES");
  });

  it("keeps AI disabled and does not introduce a migration or production mutation path", async () => {
    const activation = await source("lib/ai/activation.ts");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    expect(existsSync(resolve(root, "drizzle/migrations/0011_phase17_19_4.sql"))).toBe(false);
    const picker = await source("app/api/admin/media/picker/route.ts");
    expect(picker).not.toMatch(/POST|PUT|PATCH|DELETE|runMigrations|DATABASE_URL/);
  });

  it("keeps unsupported appearance/widget persistence honest", async () => {
    const registry = await source("lib/cms/menuRegistry.ts");
    const navigation = await source("lib/cms/adminNavigation.ts");
    expect(registry).toContain("validateMenuItems");
    expect(registry).toContain("MAX_MENU_DEPTH");
    expect(navigation).toContain('item("widgets", copy.adminCmsWidgets, null, null, "not_available")');
  });
});
