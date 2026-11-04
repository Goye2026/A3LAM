import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contentTypeRegistry } from "@/lib/cms/contentRegistry";

const root = resolve(process.cwd());

function source(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.20.02 CMS stability contracts", () => {
  it("keeps each persisted CMS type connected to its admin route and storage table", () => {
    const expected = {
      page: { route: "app/admin/(protected)/content/pages/page.tsx", table: "cms_pages" },
      post: { route: "app/admin/(protected)/content/posts/page.tsx", table: "cms_posts" },
      tag: { route: "app/admin/(protected)/content/tags/page.tsx", table: "cms_tags" },
    } as const;

    for (const [id, contract] of Object.entries(expected)) {
      const definition = contentTypeRegistry[id as keyof typeof expected];
      expect(definition.availability, id).toBe("available");
      expect(definition.storageTable, id).toBe(contract.table);
      expect(definition.routeBase, id).toBeTruthy();
      expect(existsSync(resolve(root, contract.route)), `${id} admin route`).toBe(true);
    }
  });

  it("keeps admin APIs permission-protected and public projections published-only", () => {
    const pagesApi = source("app/api/admin/cms/pages/route.ts");
    const postsApi = source("app/api/admin/cms/posts/route.ts");
    const tagsApi = source("app/api/admin/cms/tags/route.ts");
    const repository = source("lib/cms/editorialRepository.ts");
    const sitemap = source("app/sitemap.ts");
    const searchApi = source("app/api/search/route.ts");

    for (const api of [pagesApi, postsApi, tagsApi]) {
      expect(api).toContain("requirePermissionPrincipal");
    }
    expect(repository).toContain('eq(schema.cmsPages.status, "published")');
    expect(repository).toContain('eq(schema.cmsPosts.status, "published")');
    expect(repository).toContain("isNotNull(schema.cmsPages.publishedAt)");
    expect(repository).toContain("isNotNull(schema.cmsPosts.publishedAt)");
    expect(sitemap).toContain("listPublishedForSitemap");
    expect(searchApi).toContain("editorialRepository.searchPublished");
  });

  it("keeps People outside generic CMS types while preserving page/post publication contracts", () => {
    expect(contentTypeRegistry.person.domainSpecific).toBe(true);
    expect(contentTypeRegistry.person.storageTable).toBe("people");
    expect(contentTypeRegistry.person.editor).toBe("person");
    expect(contentTypeRegistry.page.supportsDraft).toBe(true);
    expect(contentTypeRegistry.post.supportsReview).toBe(true);
    expect(contentTypeRegistry.tag.supportsPublication).toBe(false);
  });
});
