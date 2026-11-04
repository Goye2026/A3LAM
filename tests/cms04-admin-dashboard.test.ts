import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Phase 17.20.04 Admin dashboard contracts", () => {
  it("uses real CMS repository data for dashboard overview and recent content", () => {
    const dashboard = source("app/admin/(protected)/page.tsx");
    expect(dashboard).toContain("editorialRepository.getWorkspaceSummary");
    expect(dashboard).toContain('editorialRepository.list("page"');
    expect(dashboard).toContain('editorialRepository.list("post"');
    expect(dashboard).toContain("admin-cms-overview");
    expect(dashboard).toContain("admin-cms-status-grid");
    expect(dashboard).toContain("admin-cms-recent-list");
    expect(dashboard).toContain('href: "/admin/content/pages/new"');
    expect(dashboard).toContain('href: "/admin/content/posts/new"');
  });

  it("keeps CMS dashboard actions permission-aware and migration-honest", () => {
    const dashboard = source("app/admin/(protected)/page.tsx");
    expect(dashboard).toContain('permission: "content.create"');
    expect(dashboard).toContain('await can("content.read")');
    expect(dashboard).toContain("cmsUnavailable");
    expect(dashboard).toContain("adminCmsRequiresMigration");
  });

  it("shows actual update and publication dates in the bounded CMS table", () => {
    const list = source("components/a3lam/CmsEditorialList.tsx");
    expect(list).toContain("function formatDate(value: string | null)");
    expect(list).toContain("formatDate(record.updatedAt)");
    expect(list).toContain("formatDate(record.publishedAt)");
    expect(list).not.toContain("record.authorId ?? \"—\"");
    expect(list).toContain("admin-row-actions");
  });

  it("adds responsive dashboard surfaces without changing public pages", () => {
    const css = source("app/globals.css");
    expect(css).toContain(".admin-cms-overview");
    expect(css).toContain(".admin-cms-status-grid");
    expect(css).toContain("@media (max-width: 39.99rem)");
    expect(css).toContain("@media (min-width: 40rem)");
  });
});
