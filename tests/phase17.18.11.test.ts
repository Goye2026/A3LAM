import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFile(resolve(process.cwd(), relativePath), "utf8");

describe("Phase 17.18.11 editorial AI workspace UX contract", () => {
  it("models the complete source-to-draft journey with explicit local-only controls", async () => {
    const source = await read("components/a3lam/ai/A3lamEditorialWorkspace.tsx");
    for (const stepKey of ["adminAiStepDocument", "adminAiStepExtraction", "adminAiStepFacts", "adminAiStepGeneration", "adminAiStepDraft", "adminAiStepClaims", "adminAiStepReview"]) {
      expect(source).toContain(stepKey);
    }
    for (const mode of ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"]) expect(source).toContain(mode);
    for (const language of ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"]) expect(source).toContain(language);
    expect(source).toContain("runEditorialDemo");
    expect(source).toContain("adminAiSandboxLabel");
    expect(source).toContain("adminAiProductionDisabled");
    expect(source).toContain("adminAiFinalBoundary");
    expect(source).not.toContain("onClick={publish");
    expect(source).not.toContain("onClick={createPerson");
    expect(source).not.toContain("onClick={createProfile");
  });

  it("keeps source provenance, review details and conflict states visible in the private workspace", async () => {
    const source = await read("components/a3lam/ai/A3lamEditorialWorkspace.tsx");
    for (const marker of ["adminAiReviewSource", "adminAiReviewConfidence", "adminAiReviewClassification", "adminAiOpenSource", "adminAiOriginalValue", "adminAiReviewedValue", "adminAiReviewer", "adminAiDecision", "adminAiConflictDetected", "adminAiNeedsHumanReview", "adminAiRequestSource"]) expect(source).toContain(marker);
    expect(source).toContain('role="alert"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-pressed={selectedFactId === fact.id}');
  });

  it("uses semantic, keyboard-accessible controls and truthful state messaging", async () => {
    const source = await read("components/a3lam/ai/A3lamEditorialWorkspace.tsx");
    const uploader = await read("components/a3lam/ai/A3lamDocumentUploader.tsx");
    expect(source).toContain("<fieldset");
    expect(source).toContain("<legend");
    expect(source).toContain('role="progressbar"');
    expect(source).toContain("aria-valuenow={progressValue}");
    expect(source).toContain("adminAiSaveDraft");
    expect(source).toContain("saveLocalDraft");
    expect(uploader).toContain('role="alert"');
    expect(uploader).toContain('role="status"');
    expect(uploader).toContain("localOnly");
    expect(uploader).toContain("onRetry");
    expect(uploader).toContain(".pdf,.docx,.txt");
  });

  it("keeps the admin route private and the public surface free of AI workspace imports", async () => {
    const adminPage = await read("app/admin/(protected)/ai/page.tsx");
    const publicRoot = await read("app/page.tsx");
    const publicCategories = await read("app/categories/page.tsx");
    expect(adminPage).toContain('robots: { index: false, follow: false }');
    expect(adminPage).toContain('getAdminPageAccess("ai.documents.read")');
    expect(publicRoot).not.toMatch(/A3lamEditorialWorkspace|DOCUMENT_DATA_BEGIN|ai-private/iu);
    expect(publicCategories).not.toMatch(/A3lamEditorialWorkspace|DOCUMENT_DATA_BEGIN|ai-private/iu);
    expect(sourceOf(adminPage)).not.toMatch(/<button[^>]*>[^<]*(?:Publish|Create Person|Create Profile)/iu);
  });

  it("defines mobile/tablet/desktop layout, reduced motion and no horizontal document overflow", async () => {
    const css = await read("app/globals.css");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    for (const selector of [".ai-stepper", ".ai-fact-detail-grid", ".ai-mode-grid", ".ai-final-actions", ".ai-claim-card"]) expect(css).toContain(selector);
  });
});

function sourceOf(value: string) {
  return value;
}
