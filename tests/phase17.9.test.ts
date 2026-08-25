import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.9 launch QA regressions", () => {
  it("does not present unavailable homepage counts as zero", () => {
    const homepage = readProjectFile("app/page.tsx");
    expect(homepage).toContain('{ value: dataUnavailable ? "—" : String(people.length).padStart(2, "0"), label: copy.statsPeople }');
    expect(homepage).toContain('{ value: dataUnavailable ? "—" : String(categories.length).padStart(2, "0"), label: copy.statsCategories }');
  });

  it("uses the category-specific empty state on the homepage", () => {
    const homepage = readProjectFile("app/page.tsx");
    expect(homepage).toContain("{dataUnavailable ? copy.dataUnavailable : copy.categoryNoPeople}");
  });

  it("does not leave search in loading state when submitted without filters", () => {
    const search = readProjectFile("components/a3lam/SearchDiscovery.tsx");
    expect(search).toContain("if (!hasFilters) {");
    expect(search).toContain('setSearchState("idle");');
    expect(search).not.toContain('placeholder="مثال: صنعاء"');
    expect(search).not.toContain('placeholder="مثال: اليمن"');
    expect(search).toContain("placeholder={copy.searchCityPlaceholder}");
    expect(search).toContain("placeholder={copy.searchCountryPlaceholder}");
  });

  it("keeps the admin profiles database error localized and generic", () => {
    const profiles = readProjectFile("app/admin/(protected)/profiles/page.tsx");
    expect(profiles).toContain("{copy.adminDatabaseError}");
    expect(profiles).not.toContain("تعذر الاتصال بقاعدة البيانات.");
  });

  it("gives the global error recovery action an explicit retry label", () => {
    const errorBoundary = readProjectFile("app/error.tsx");
    const messages = readProjectFile("lib/i18n/messages.ts");
    expect(errorBoundary).toContain("{copy.retryAction}");
    expect(messages).toContain('retryAction: "المحاولة مرة أخرى"');
    expect(messages).toContain('retryAction: "Try again"');
  });
});
