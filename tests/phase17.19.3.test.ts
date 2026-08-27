import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CMS_EDITORIAL_STATUSES, canTransitionCmsEditorialStatus } from "@/lib/cms/editorialStatus";
import { contentTypeRegistry } from "@/lib/cms/contentRegistry";
import { assertCmsSlug, isSafeCmsInternalPath, validateCmsSlug } from "@/lib/cms/slug";
import { parseCmsRichTextDocument } from "@/lib/cms/richText";
import { parseCmsEditorialMutation, parseCmsTagInput } from "@/lib/cms/editorialValidation";
import { hasAdminPermission } from "@/lib/admin/rbac";

const root = resolve(process.cwd());
const source = (path: string) => readFile(resolve(root, path), "utf8");
const validDocument = { version: 1, direction: "rtl", blocks: [{ type: "heading", level: 2, children: [{ type: "text", text: "عنوان آمن" }] }, { type: "paragraph", children: [{ type: "text", text: "نص تحريري" }] }] };

const validPage = { title: "صفحة اختبار", slug: "safe-page", content: validDocument, excerpt: "ملخص", template: "single-page", seoTitle: "عنوان", seoDescription: "وصف", canonicalUrl: null, categoryIds: [], tagIds: [] };

const validPost = { ...validPage, title: "مقال اختبار", slug: "safe-post", template: "single-post" };

describe("Phase 17.19.3 editorial content engine", () => {
  it("keeps the editorial status machine separate and deterministic", () => {
    expect(CMS_EDITORIAL_STATUSES).toEqual(["draft", "review", "scheduled", "published", "trashed"]);
    expect(canTransitionCmsEditorialStatus("draft", "review")).toBe(true);
    expect(canTransitionCmsEditorialStatus("draft", "published")).toBe(false);
    expect(canTransitionCmsEditorialStatus("review", "published")).toBe(true);
    expect(canTransitionCmsEditorialStatus("published", "review")).toBe(false);
    expect(canTransitionCmsEditorialStatus("trashed", "draft")).toBe(true);
  });

  it("normalizes Unicode slugs and rejects reserved or unsafe paths", () => {
    expect(assertCmsSlug(" صفحة عربية ")).toBe("صفحة-عربية");
    expect(validateCmsSlug("/admin").valid).toBe(false);
    expect(validateCmsSlug("../secret").valid).toBe(false);
    expect(validateCmsSlug("safe--slug").valid).toBe(true);
    expect(isSafeCmsInternalPath("/page/صفحة-عربية")).toBe(true);
    expect(isSafeCmsInternalPath("/admin/users")).toBe(false);
    expect(isSafeCmsInternalPath("//evil.example")).toBe(false);
  });

  it("accepts bounded typed rich text and rejects raw HTML and executable URLs", () => {
    expect(parseCmsRichTextDocument(validDocument).blocks).toHaveLength(2);
    expect(() => parseCmsRichTextDocument({ version: 1, direction: "auto", blocks: [{ type: "paragraph", children: [{ type: "text", text: "<script>alert(1)</script>" }] }] })).toThrow("raw HTML");
    expect(() => parseCmsRichTextDocument({ version: 1, direction: "auto", blocks: [{ type: "paragraph", children: [{ type: "link", href: "javascript:alert(1)", children: [{ type: "text", text: "bad" }] }] }] })).toThrow();
  });

  it("validates Page/Post/Tag payloads and keeps Page taxonomy disallowed", () => {
    expect(parseCmsEditorialMutation(validPage, "page").slug).toBe("safe-page");
    expect(parseCmsEditorialMutation(validPost, "post").template).toBe("single-post");
    expect(() => parseCmsEditorialMutation({ ...validPage, tagIds: ["tag-1"] }, "page")).toThrow("Pages do not accept taxonomy");
    expect(() => parseCmsEditorialMutation({ ...validPost, featuredMediaId: "media-1" }, "post")).toThrow("Media Library configuration");
    expect(() => parseCmsEditorialMutation({ ...validPost, template: "../../unsafe" }, "post")).toThrow("template is not supported");
    expect(parseCmsTagInput({ name: "وسم", slug: "وسم" }).slug).toBe("وسم");
  });

  it("keeps registry domain separation and makes new persistence status explicit", () => {
    expect(contentTypeRegistry.person.domainSpecific).toBe(true);
    expect(contentTypeRegistry.profile.domainSpecific).toBe(true);
    expect(contentTypeRegistry.page).toMatchObject({ storageTable: "cms_pages", availability: "requires_configuration", supportsPublication: true });
    expect(contentTypeRegistry.post).toMatchObject({ storageTable: "cms_posts", availability: "requires_configuration", supportsPublication: true });
    expect(contentTypeRegistry.tag).toMatchObject({ storageTable: "cms_tags", availability: "requires_configuration", supportsPublication: false });
    expect(hasAdminPermission("EDITOR", "content.create")).toBe(true);
    expect(hasAdminPermission("EDITOR", "content.publish")).toBe(false);
  });

  it("keeps new mutation routes behind same-origin and canonical permissions", async () => {
    const routes = ["app/api/admin/cms/pages/route.ts", "app/api/admin/cms/pages/[id]/route.ts", "app/api/admin/cms/pages/[id]/status/route.ts", "app/api/admin/cms/posts/route.ts", "app/api/admin/cms/posts/[id]/route.ts", "app/api/admin/cms/posts/[id]/status/route.ts", "app/api/admin/cms/tags/route.ts", "app/api/admin/cms/tags/[id]/route.ts"];
    for (const route of routes) {
      expect(existsSync(resolve(root, route)), route).toBe(true);
      const text = await source(route);
      expect(text, route).toContain("requirePermissionPrincipal");
      if (text.includes("POST") || text.includes("PUT") || text.includes("PATCH")) expect(text, route).toContain("isSameOriginMutation");
    }
  });

  it("keeps preview private and public projection published-only", async () => {
    const previewFiles = ["app/admin/(protected)/content/pages/[id]/preview/page.tsx", "app/admin/(protected)/content/posts/[id]/preview/page.tsx"];
    for (const path of previewFiles) {
      const text = await source(path);
      expect(text, path).toContain("index: false");
      expect(text, path).toContain("follow: false");
    }
    const repository = await source("lib/cms/editorialRepository.ts");
    expect(repository).toContain('eq(schema.cmsPages.status, "published")');
    expect(repository).toContain('eq(schema.cmsPosts.status, "published")');
    expect(repository).toContain("listPublishedForSitemap");
    expect(await source("app/sitemap.ts")).toContain("listPublishedForSitemap");
  });

  it("keeps the migration additive and unapplied by test/runtime policy", async () => {
    const migration = await source("drizzle/migrations/0010_phase17_19_3_content_engine.sql");
    const manifest = await source("lib/db/migrations/manifest.mjs");
    expect(manifest).toContain("0010_phase17_19_3_content_engine.sql");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS cms_pages");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS cms_content_revisions");
    expect(migration).toContain("cms_content_revisions_owner_check");
    expect(migration).toContain("page_id");
    expect(migration).toContain("post_id");
    expect(migration).not.toMatch(/\b(INSERT INTO|UPDATE\s+cms_|DELETE FROM\s+cms_)/i);
    expect(await source("scripts/db-migrate.mjs")).toContain("runner.mjs");
    expect(await source("lib/admin/requestBody.ts")).toContain("DEFAULT_MAX_JSON_BYTES");
  });

  it("does not add dynamic execution or weaken the AI hard boundary", async () => {
    const files = ["lib/cms/editorialStatus.ts", "lib/cms/slug.ts", "lib/cms/richText.ts", "lib/cms/editorialValidation.ts", "lib/cms/editorialRepository.ts", "components/a3lam/CmsRichTextRenderer.tsx", "components/a3lam/CmsEditorialEditor.tsx"];
    for (const path of files) {
      const text = await source(path);
      expect(text, path).not.toMatch(/\beval\s*\(|\bnew Function\s*\(/);
      expect(text, path).not.toMatch(/dangerouslySetInnerHTML|<iframe|<script/i);
    }
    const activation = await source("lib/ai/activation.ts");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
  });
});
