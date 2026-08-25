import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.13 content readiness UX regressions", () => {
  it("keeps People readiness presentation aligned with server lifecycle states", () => {
    const form = readProjectFile("components/a3lam/AdminPersonForm.tsx");
    expect(form).toContain("admin-readiness-panel");
    expect(form).toContain("adminReadinessBlockedLabel");
    expect(form).toContain("targetStatus === \"published\" && !readiness.publishReady");
    expect(form).toContain("beforeunload");
  });

  it("keeps Category and People list filtering reversible without changing repository contracts", () => {
    const people = readProjectFile("app/admin/(protected)/people/page.tsx");
    const categories = readProjectFile("app/admin/(protected)/categories/page.tsx");
    expect(people).toContain("copy.adminClearFilters");
    expect(people).toContain("unavailable ? \"—\" : data?.total ?? 0");
    expect(categories).toContain('href=\"/admin/categories\"');
  });

  it("provides truthful Search empty-query and retry states through the existing GET API", () => {
    const search = readProjectFile("components/a3lam/SearchDiscovery.tsx");
    const messages = readProjectFile("lib/i18n/messages.ts");
    expect(search).toContain('SearchState = \"idle\" | \"loading\" | \"success\" | \"error\" | \"empty\"');
    expect(search).toContain("copy.searchEmptyQuery");
    expect(search).toContain("handleRetry");
    expect(search).toContain('aria-busy={searchState === "loading"}');
    expect(messages).toContain("searchEmptyQuery");
  });

  it("surfaces advisory profile completion without adding a new publication rule", () => {
    const editor = readProjectFile("components/a3lam/ProfileEditor.tsx");
    expect(editor).toContain("editor-readiness");
    expect(editor).toContain("copy.editorReadinessAdvisory");
    expect(editor).toContain("remainingCompletionItems");
    expect(editor).not.toContain("validateProfileForPublication");
  });

  it("keeps admin profile review readiness derived from existing public projection fields", () => {
    const review = readProjectFile("app/admin/(protected)/profiles/[id]/page.tsx");
    expect(review).toContain("admin-profile-readiness");
    expect(review).toContain("categories.every((category) => category.status === \"published\")");
    expect(review).toContain("Boolean(source)");
    expect(review).toContain("adminReadinessTitle");
  });
});
