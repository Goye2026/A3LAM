import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 17.20.06 site experience builders", () => {
  it("exposes persisted homepage ordering, visibility, and real directory selections", () => {
    const editor = read("components/a3lam/AdminSiteExperienceEditor.tsx");
    const page = read("components/a3lam/AdminSiteExperiencePage.tsx");
    expect(editor).toContain("selectedCategoryIds");
    expect(editor).toContain("selectedPersonIds");
    expect(editor).toContain("adminMoveUp");
    expect(editor).toContain("adminMoveDown");
    expect(page).toContain("listCategoryOptions");
    expect(page).toContain('status: "published"');
  });

  it("exposes all persisted homepage copy, visibility, CTA, and media controls", () => {
    const editor = read("components/a3lam/AdminSiteExperienceEditor.tsx");
    expect(editor).toContain("CmsMediaPicker");
    expect(editor).toContain("sectionDescription");
    expect(editor).toContain("value.profiles.visible");
    expect(editor).toContain("value.about.visible");
    expect(editor).toContain("value.finalCta.title");
    expect(editor).toContain("personQuery");
  });

  it("supports internal records, external links, visibility, and persisted navigation ordering", () => {
    const editor = read("components/a3lam/AdminSiteExperienceEditor.tsx");
    const header = read("components/a3lam/SiteHeader.tsx");
    expect(editor).toContain("navigation-options-");
    expect(editor).toContain('value="/categories"');
    expect(editor).toContain('value="external"');
    expect(header).toContain('rel: "noopener noreferrer"');
  });

  it("renders non-empty footer groups and their saved headings publicly", () => {
    const editor = read("components/a3lam/AdminSiteExperienceEditor.tsx");
    const footer = read("components/a3lam/SiteFooter.tsx");
    expect(editor).toContain("addGroupLink");
    expect(editor).toContain("moveGroupLink");
    expect(footer).toContain('className="footer-link-group"');
    expect(footer).toContain("group.title");
    expect(footer).toContain("group.links.length > 0");
  });

  it("continues to use the existing draft/publish repository and site-experience API", () => {
    const editor = read("components/a3lam/AdminSiteExperienceEditor.tsx");
    const route = read("app/api/admin/site-experience/[resource]/route.ts");
    const repository = read("lib/site-experience/repository.ts");
    expect(editor).toContain("saveDraft");
    expect(editor).toContain("publish");
    expect(route).toContain("siteExperienceRepository.saveDraft");
    expect(route).toContain('isSameOriginMutation(request)');
    expect(repository).toContain("siteExperienceConfigs");
  });

  it("renders published homepage settings through the existing public homepage", () => {
    const homepage = read("app/page.tsx");
    expect(homepage).toContain('getPublishedResource("homepage")');
    expect(homepage).toContain("homepage.hero.imageUrl");
    expect(homepage).toContain("homepage.featured.selectedPersonIds");
    expect(homepage).toContain("sectionStyle(homepage");
    expect(homepage).toContain("homepage.profiles.visible");
    expect(homepage).toContain("homepage.about.visible");
  });
});
