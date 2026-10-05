import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 17.19.28 Homepage, Appearance, and Site Experience contracts", () => {
  const homepage = read("app/page.tsx");
  const layout = read("app/layout.tsx");
  const header = read("components/a3lam/SiteHeader.tsx");
  const repository = read("lib/site-experience/repository.ts");
  const updateApi = read("app/api/admin/site-experience/[resource]/route.ts");
  const publishApi = read("app/api/admin/site-experience/[resource]/publish/route.ts");
  const access = read("lib/site-experience/access.ts");

  it("renders published homepage configuration, visibility, ordering, and category selection", () => {
    expect(homepage).toContain('getPublishedResource("homepage")');
    expect(homepage).toContain("sectionOrder(homepage");
    expect(homepage).toContain("isVisible(homepage");
    expect(homepage).toContain("selectedCategoryIds");
    expect(homepage).toContain("selectedPersonIds");
    expect(homepage).toContain("homepage.about.title");
  });

  it("exposes persisted appearance controls to the public render tree", () => {
    for (const attribute of ["data-typography", "data-spacing", "data-navigation-style", "data-button-style", "data-hero-style", "data-footer-style", "data-primary", "data-accent", "data-surface"]) {
      expect(layout).toContain(attribute);
    }
  });

  it("uses persisted identity and navigation contracts publicly", () => {
    expect(header).toContain('getPublishedResource("navigation")');
    expect(header).toContain('getPublishedResource("identity")');
    expect(header).toContain("identity.logoUrl");
    expect(header).toContain('target: "_blank"');
  });

  it("keeps mutations server-side, validated, same-origin, and permission-gated", () => {
    expect(updateApi).toContain("requirePermissionPrincipal");
    expect(updateApi).toContain("isSameOriginMutation");
    expect(updateApi).toContain("saveDraft");
    expect(publishApi).toContain("requirePermissionPrincipal");
    expect(publishApi).toContain("isSameOriginMutation");
    expect(publishApi).toContain("publish");
    expect(access).toContain('homepage: { read: "homepage.read", update: "homepage.update", publish: "homepage.publish" }');
  });

  it("persists draft and published state with audit entries", () => {
    expect(repository).toContain("siteExperienceConfigs");
    expect(repository).toContain("onConflictDoUpdate");
    expect(repository).toContain("auditLogs");
    expect(repository).toContain("getPublishedResource");
  });
});
