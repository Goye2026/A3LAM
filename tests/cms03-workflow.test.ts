import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assertCmsPublishable, parseCmsEditorialMutation } from "@/lib/cms/editorialValidation";
import { EMPTY_CMS_RICH_TEXT } from "@/lib/cms/richText";

const root = resolve(process.cwd());
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

const content = {
  version: 1 as const,
  direction: "rtl" as const,
  blocks: [{ type: "paragraph" as const, children: [{ type: "text" as const, text: "محتوى تحريري" }] }],
};

describe("Phase 17.20.03 editorial workflow contracts", () => {
  it("keeps page and post payload validation separate and preserves required fields", () => {
    expect(parseCmsEditorialMutation({ title: "صفحة", slug: "page-one", content, template: "single-page" }, "page")).toMatchObject({ title: "صفحة", slug: "page-one", template: "single-page" });
    expect(parseCmsEditorialMutation({ title: "مقال", slug: "post-one", content, template: "single-post", categoryIds: ["history"], tagIds: ["news"] }, "post")).toMatchObject({ title: "مقال", slug: "post-one", template: "single-post", categoryIds: ["history"], tagIds: ["news"] });
    expect(() => parseCmsEditorialMutation({ title: "", slug: "page-one", content, template: "single-page" }, "page")).toThrow(/title is required/);
    expect(() => parseCmsEditorialMutation({ title: "صفحة", slug: "admin", content, template: "single-page" }, "page")).toThrow(/reserved/);
    expect(() => parseCmsEditorialMutation({ title: "صفحة", slug: "page-one", content, template: "single-page", categoryIds: ["history"] }, "page")).toThrow(/taxonomy/);
  });

  it("requires non-empty content before publication while allowing empty drafts", () => {
    const draft = parseCmsEditorialMutation({ title: "مسودة", slug: "draft-one", content: EMPTY_CMS_RICH_TEXT, template: "single-page" }, "page");
    expect(() => assertCmsPublishable(draft)).toThrow(/content is required before publishing/);
    expect(() => assertCmsPublishable({ ...draft, content })).not.toThrow();
  });

  it("keeps unsupported scheduled publishing blocked at the repository boundary", () => {
    const repository = source("lib/cms/editorialRepository.ts");
    const editor = source("components/a3lam/CmsEditorialEditor.tsx");
    expect(repository).toContain('if (next === "scheduled") throw new CmsInputError("Scheduled publishing is not available")');
    expect(editor).toContain("adminCmsSchedulingUnavailable");
    expect(editor).not.toContain('onClick={() => void transition("scheduled")');
  });

  it("preserves protected preview, mutation barriers, and revision draft restoration", () => {
    const preview = source("app/admin/(protected)/content/pages/[id]/preview/page.tsx");
    const create = source("app/api/admin/cms/pages/route.ts");
    const status = source("app/api/admin/cms/pages/[id]/status/route.ts");
    const restore = source("lib/cms/editorialRepository.ts");
    expect(preview).toContain('getAdminPageAccess("content.read")');
    expect(preview).toContain('robots: { index: false, follow: false }');
    expect(create).toContain('requirePermissionPrincipal(request, "content.create")');
    expect(create).toContain("isSameOriginMutation");
    expect(status).toContain("permissionForStatus");
    expect(status).toContain("isSameOriginMutation");
    expect(restore).toContain('status: "draft", publishedAt: null');
    expect(restore).toContain('"restore_revision"');
  });

  it("keeps the editor usable with local recovery, unload protection, and explicit feedback states", () => {
    const editor = source("components/a3lam/CmsEditorialEditor.tsx");
    expect(editor).toContain("localStorage");
    expect(editor).toContain("beforeunload");
    expect(editor).toContain('role="alert"');
    expect(editor).toContain('role="status"');
    expect(editor).toContain("setDirty(false)");
  });
});
