import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.11 homepage discovery regressions", () => {
  it("keeps the hero outside the catalog data suspense boundary", () => {
    const homepage = readProjectFile("app/page.tsx");
    expect(homepage).toContain("<Suspense fallback={<HomepageCatalogFallback");
    expect(homepage.indexOf("<section className=\"a3lam-hero\"")).toBeLessThan(homepage.indexOf("<Suspense fallback="));
    expect(homepage).toContain("async function HomepageCatalogSections");
  });

  it("does not map ordinal presentation labels as category counts", () => {
    const catalog = readProjectFile("lib/a3lam/catalog.ts");
    expect(catalog).toContain("indexLabel: String(index + 1).padStart(2, \"0\")");
    expect(catalog).not.toContain("count: String(index + 1)");
  });

  it("keeps discovery honest when timeline data is unavailable", () => {
    const discovery = readProjectFile("components/a3lam/HomepageDiscovery.tsx");
    const messages = readProjectFile("lib/i18n/messages.ts");
    expect(discovery).toContain("copy.discoveryDeferred");
    expect(discovery).toContain("copy.discoverySearchAction");
    expect(messages).toContain('discoveryDeferredLabel: "قيد الإعداد"');
    expect(messages).toContain('discoveryDeferredLabel: "In preparation"');
  });

  it("renders trust and discovery as reusable public components", () => {
    const homepage = readProjectFile("app/page.tsx");
    expect(homepage).toContain("<HomepageDiscovery copy={publicCopy} />");
    expect(homepage).toContain("<HomepageTrust copy={publicCopy} />");
  });

  it("keeps the mobile menu localized and wired for assistive technology", () => {
    const header = readProjectFile("components/a3lam/SiteHeader.tsx");
    const menu = readProjectFile("components/a3lam/MobileMenu.tsx");
    const messages = readProjectFile("lib/i18n/messages.ts");
    expect(header).toContain('import { MobileMenu } from "./MobileMenu";');
    expect(header).toContain("<MobileMenu copy={copy} links={mobileLinks} />");
    expect(menu).toContain('aria-expanded={open}');
    expect(menu).toContain('aria-controls={panelId}');
    expect(messages).toContain('closeMenu: "إغلاق القائمة"');
  });

  it("consumes existing homepage presentation settings without changing the search contract", () => {
    const homepage = readProjectFile("app/page.tsx");
    const search = readProjectFile("components/a3lam/SearchDiscovery.tsx");
    const css = readProjectFile("app/globals.css");
    expect(homepage).toContain("homepage.search.helperText");
    expect(homepage).toContain("homepage.categories.displayMode");
    expect(search).toContain("helperText?: string;");
    expect(search).toContain("discovery-helper-text");
    expect(css).toContain(".category-grid-list");
  });

  it("keeps reduced motion and responsive hooks in the centralized stylesheet", () => {
    const css = readProjectFile("app/globals.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".discovery-form-advanced");
    expect(css).toContain("@media (max-width: 30rem)");
  });
});
