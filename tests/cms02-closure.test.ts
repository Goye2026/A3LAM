import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("CMS-02 closure: real HTTP 404 status contracts", () => {
  it("removes the root loading boundary that streams public CMS responses", () => {
    expect(existsSync(resolve(root, "app/loading.tsx"))).toBe(false);
  });

  it.each([
    ["page", "app/page/[slug]/page.tsx"],
    ["article", "app/article/[slug]/page.tsx"],
  ])("keeps %s route server-side and uses notFound for unavailable content", (_kind, path) => {
    const route = source(path);
    expect(route).toContain("notFound");
    expect(route).toContain("if (!record) notFound()");
    expect(route).toContain("getPublishedBySlug");
  });

  it("enforces published status and publishedAt in both public CMS lookups", () => {
    const repository = source("lib/cms/editorialRepository.ts");
    expect(repository).toContain('eq(schema.cmsPages.status, "published")');
    expect(repository).toContain('eq(schema.cmsPosts.status, "published")');
    expect(repository).toContain("isNotNull(schema.cmsPages.publishedAt)");
    expect(repository).toContain("isNotNull(schema.cmsPosts.publishedAt)");
  });
});
