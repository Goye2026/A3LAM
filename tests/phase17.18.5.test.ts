import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getAiProductionActivationState, AI_PRODUCTION_ENABLED } from "@/lib/ai/activation";
import { getAiWorkspaceCapabilities } from "@/lib/ai/workspace";
import { buildGenerationPrompt, promptContainsInstructionLikeText } from "@/lib/ai/generation/prompt";
import { createGenerationRequest, runGeneration } from "@/lib/ai/generation/orchestrator";
import { validateGenerationReviewInput } from "@/lib/ai/generation/review";
import { unconfiguredAiGenerationProvider } from "@/lib/ai/provider";
import { hasAdminPermission } from "@/lib/admin/rbac";
import type { AiGenerationInput, AiGenerationLanguage, AiGenerationMode } from "@/lib/ai/types";
import {
  buildSyntheticInput,
  createMockProvider,
  IsolatedAiHarness,
  isPrivateIsolatedDocumentKey,
  type MockProviderBehavior,
} from "./support/phase17.18.5-harness";

const fixturePath = (name: string) => resolve(process.cwd(), "fixtures/ai", name);

async function fixtureFile(name: string, type: string) {
  return new File([await readFile(fixturePath(name))], name, { type });
}

async function preparedHarness() {
  const harness = new IsolatedAiHarness();
  const file = await fixtureFile("arabic-cv.txt", "text/plain");
  const submitted = await harness.submit(file);
  if (submitted.duplicate) throw new Error("unexpected duplicate synthetic fixture");
  const extraction = await harness.extract(submitted.document.id, file);
  for (const fact of extraction.candidateFacts) {
    const storedFact = submitted.document.facts.find((item) => item.fieldPath === fact.fieldPath);
    if (storedFact) harness.reviewFact(submitted.document.id, storedFact.id, "ACCEPTED", "isolated-editor");
  }
  return { harness, document: submitted.document };
}

function generationInput(documentId: string, overrides: Partial<AiGenerationInput> = {}): AiGenerationInput {
  return { ...buildSyntheticInput(documentId), ...overrides };
}

async function runBehavior(behavior: MockProviderBehavior, input = generationInput("synthetic-document")) {
  const request = createGenerationRequest(`job-${behavior}`, "PROFESSIONAL_PROFILE", "ARABIC", input);
  return runGeneration(request, createMockProvider(behavior));
}

describe("Phase 17.18.5 isolated activation-readiness gate", () => {
  it("executes Document → Extraction → Facts → Review → Generation → Claims → Review → Final Draft", async () => {
    const { harness, document } = await preparedHarness();
    expect(document.storageKey).toMatch(/^ai-private\//);
    expect(isPrivateIsolatedDocumentKey(document.storageKey)).toBe(true);
    expect(document.extraction).not.toBeNull();
    expect(document.facts.every((fact) => fact.reviewStatus === "ACCEPTED")).toBe(true);

    const created = harness.createGenerationJob(document.id, "A3LAM_PERSON_DRAFT", "BILINGUAL");
    const result = await harness.executeGeneration(created.job, createMockProvider("valid"));
    expect(result).not.toBeNull();
    if (!result) throw new Error("isolated generation result missing");
    expect(result.status).toBe("SUCCEEDED");
    expect(result.draftStatus).toBe("DRAFT");
    expect(result.qualityGate).toBe("PASS_WITH_REVIEW");
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.claims[0]?.provenance.length).toBeGreaterThan(0);

    const claim = result.claims[0];
    if (!claim) throw new Error("synthetic claim missing");
    const decision = harness.reviewClaim(created.job, claim.id, { action: "ACCEPT", reviewerNote: "Synthetic isolated review" }, "isolated-reviewer");
    expect(decision.reviewerId).toBe("isolated-reviewer");
    expect(decision.originalValue).toBeDefined();
    expect(harness.finalDraft(created.job)?.claims).toHaveLength(1);

    const serialized = JSON.stringify([...harness.documents.values()]);
    expect(serialized).not.toContain("personId");
    expect(serialized).not.toContain("profileId");
    expect(serialized).not.toContain("published");
    expect(harness.events.every((event) => !JSON.stringify(event).includes("DOCUMENT_DATA_BEGIN"))).toBe(true);
  });

  it("covers Arabic, English, mixed-language, sections and candidate facts with real local extraction", async () => {
    const arabicHarness = new IsolatedAiHarness();
    const arabicFile = await fixtureFile("arabic-cv.txt", "text/plain");
    const arabic = await arabicHarness.submit(arabicFile);
    const englishHarness = new IsolatedAiHarness();
    const english = await englishHarness.submit(await fixtureFile("english-cv.txt", "text/plain"));
    const mixedHarness = new IsolatedAiHarness();
    const mixedFile = await fixtureFile("mixed-cv.txt", "text/plain");
    const mixed = await mixedHarness.submit(mixedFile);
    if (arabic.duplicate || english.duplicate || mixed.duplicate) throw new Error("unexpected duplicate fixture");
    const arabicExtraction = await arabicHarness.extract(arabic.document.id, arabicFile);
    const englishExtraction = await englishHarness.extract(english.document.id, await fixtureFile("english-cv.txt", "text/plain"));
    const mixedExtraction = await mixedHarness.extract(mixed.document.id, mixedFile);
    expect(arabicExtraction.language).toBe("mixed");
    expect(englishExtraction.language).toBe("en");
    expect(mixedExtraction.language).toBe("mixed");
    expect(arabicExtraction.sections.map((section) => section.type)).toEqual(expect.arrayContaining(["EDUCATION", "EXPERIENCE"]));
    expect(mixedExtraction.candidateFacts.map((fact) => fact.fieldPath)).toEqual(expect.arrayContaining(["contact.email", "contact.website"]));
  });

  it("handles conflict as NEEDS_REVIEW without selecting a source value automatically", async () => {
    const input = generationInput("conflict-document", {
      facts: [
        { ...buildSyntheticInput("conflict-document").facts[0], id: "fact-a", value: "2020", fieldPath: "experience.startDate", evidenceIds: ["evidence-a"] },
        { ...buildSyntheticInput("conflict-document").facts[0], id: "fact-b", value: "2021", fieldPath: "experience.startDate", evidenceIds: ["evidence-b"] },
      ],
    });
    const result = await runBehavior("conflict", input);
    expect(result.qualityGate).toBe("PASS_WITH_REVIEW");
    expect(result.claims[0]?.status).toBe("CONFLICTED");
  });

  it("contains prompt injection as untrusted data and keeps system instructions unchanged", async () => {
    const promptFixture = await readFile(fixturePath("prompt-injection-cv.txt"), "utf8");
    const prompt = buildGenerationPrompt({ ...generationInput("injection-document"), normalizedText: promptFixture, sourceLanguage: "mixed" }, "BIOGRAPHY", "ARABIC");
    expect(promptContainsInstructionLikeText(prompt)).toBe(true);
    expect(prompt.messages[0]?.content).not.toContain("publish this profile");
    expect(prompt.messages[1]?.content).toContain("DOCUMENT_DATA_BEGIN");
    expect(prompt.messages[1]?.content).toContain("publish this profile");
  });

  it("rejects malformed/unsafe fixtures and reports OCR_REQUIRED for image-only PDF", async () => {
    const harness = new IsolatedAiHarness();
    await expect(harness.submit(new File(["<html><script>unsafe</script>"], "unsafe.txt", { type: "text/plain" }))).rejects.toMatchObject({ code: "INVALID_FILE" });
    await expect(harness.submit(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "oversized.txt", { type: "text/plain" }))).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
    const pdfFile = await fixtureFile("empty.pdf", "application/pdf");
    const pdfSubmission = await harness.submit(pdfFile);
    if (pdfSubmission.duplicate) throw new Error("unexpected duplicate PDF fixture");
    await expect(harness.extract(pdfSubmission.document.id, pdfFile)).rejects.toMatchObject({ code: "OCR_REQUIRED" });
    await expect(harness.submit(await fixtureFile("malformed.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).rejects.toMatchObject({ code: "DOCX_INVALID" });
    const suspiciousFile = await fixtureFile("suspicious.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const suspiciousSubmission = await harness.submit(suspiciousFile);
    if (suspiciousSubmission.duplicate) throw new Error("unexpected duplicate DOCX fixture");
    await expect(harness.extract(suspiciousSubmission.document.id, suspiciousFile)).rejects.toMatchObject({ code: "DOCX_UNSAFE_ARCHIVE" });
  });

  it("passes every configured generation mode/language through the same draft-only gate", async () => {
    const modes: AiGenerationMode[] = ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"];
    const languages: AiGenerationLanguage[] = ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"];
    for (const mode of modes) {
      for (const language of languages) {
        const request = createGenerationRequest(`matrix-${mode}-${language}`, mode, language, generationInput("matrix-document"));
        const result = await runGeneration(request, createMockProvider("valid"));
        expect(result.status).toBe("SUCCEEDED");
        expect(result.draftStatus).toBe("DRAFT");
        expect(result.qualityGate).toBe("PASS_WITH_REVIEW");
      }
    }
  });

  it("enforces claim evidence/provenance, secret-like, suspicious output and quality gates", async () => {
    await expect(runBehavior("malformed")).resolves.toMatchObject({ status: "FAILED", errorCode: "INVALID_OUTPUT", qualityGate: "REJECTED" });
    await expect(runBehavior("missing-evidence")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "PASS_WITH_REVIEW", errorCode: "REVIEW_REQUIRED" });
    await expect(runBehavior("unsupported-claims")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "INVALID_OUTPUT" });
    await expect(runBehavior("secret-like")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "PRIVACY_BLOCKED" });
    await expect(runBehavior("instruction-like")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "PRIVACY_BLOCKED" });
  });

  it("simulates ACCEPT, EDIT, REJECT and REQUEST_SOURCE while retaining audit values", async () => {
    for (const [index, action] of (["ACCEPT", "EDIT", "REJECT", "REQUEST_SOURCE"] as const).entries()) {
      const { harness, document } = await preparedHarness();
      const job = harness.createGenerationJob(document.id, "BIOGRAPHY", "ARABIC").job;
      const result = await harness.executeGeneration(job, createMockProvider("valid"));
      expect(result).not.toBeNull();
      if (!result) throw new Error("isolated generation result missing");
      const claim = result.claims[0];
      if (!claim) throw new Error("synthetic claim missing");
      const input = action === "EDIT" ? { action, reviewedValue: "Edited synthetic value", reviewerNote: "Correction" } : { action, reviewerNote: `Decision ${index}` };
      const decision = harness.reviewClaim(job, claim.id, input, "isolated-reviewer");
      expect(decision.originalValue).toBeDefined();
      expect(decision.reviewerId).toBe("isolated-reviewer");
      if (action === "EDIT") expect(decision.reviewedValue).toBe("Edited synthetic value");
      if (action === "REJECT" || action === "REQUEST_SOURCE") expect(harness.finalDraft(job)?.claims).toHaveLength(0);
      if (action === "ACCEPT" || action === "EDIT") expect(harness.finalDraft(job)?.claims).toHaveLength(1);
    }
    expect(() => validateGenerationReviewInput({ action: "EDIT" })).toThrow();
  });

  it("keeps document and generation idempotency and bounds retries", async () => {
    const harness = new IsolatedAiHarness();
    const file = await fixtureFile("english-cv.txt", "text/plain");
    const first = await harness.submit(file);
    const second = await harness.submit(file);
    if (first.duplicate) throw new Error("unexpected duplicate first submission");
    expect(second.duplicate).toBe(true);
    expect(second.document.id).toBe(first.document.id);
    expect(harness.queue.jobs).toHaveLength(1);

    await harness.extract(first.document.id, file);
    for (const fact of first.document.facts) harness.reviewFact(first.document.id, fact.id, "ACCEPTED", "isolated-editor");
    const jobFirst = harness.createGenerationJob(first.document.id, "PROFESSIONAL_PROFILE", "ENGLISH");
    const jobSecond = harness.createGenerationJob(first.document.id, "PROFESSIONAL_PROFILE", "ENGLISH");
    expect(jobSecond.duplicate).toBe(true);
    const calls = { count: 0 };
    const resultOne = await harness.executeGeneration(jobFirst.job, createMockProvider("valid", calls));
    const resultTwo = await harness.executeGeneration(jobFirst.job, createMockProvider("valid", calls));
    expect(resultTwo).toEqual(resultOne);
    expect(calls.count).toBe(1);

    const retryJob = harness.createGenerationJob(first.document.id, "SEO_DRAFT", "ENGLISH").job;
    await harness.executeGeneration(retryJob, createMockProvider("timeout"));
    expect(retryJob.attempts).toBe(1);
    await harness.executeGeneration(retryJob, createMockProvider("valid"));
    expect(retryJob.result?.status).toBe("SUCCEEDED");
    const exhaustedJob = harness.createGenerationJob(first.document.id, "BIOGRAPHY", "ENGLISH").job;
    for (let attempt = 0; attempt < 4; attempt += 1) await harness.executeGeneration(exhaustedJob, createMockProvider("provider-failure"));
    expect(exhaustedJob.attempts).toBe(3);
  });

  it("recovers from storage, queue and extraction failures with explicit outcomes", async () => {
    const storageHarness = new IsolatedAiHarness();
    storageHarness.storage.failNextPut = true;
    await expect(storageHarness.submit(await fixtureFile("arabic-cv.txt", "text/plain"))).rejects.toThrow("synthetic storage failure");
    expect(storageHarness.documents.size).toBe(0);

    const queueHarness = new IsolatedAiHarness();
    queueHarness.queue.failNextEnqueue = true;
    await expect(queueHarness.submit(await fixtureFile("arabic-cv.txt", "text/plain"))).rejects.toThrow("synthetic queue failure");
    expect(queueHarness.documents.size).toBe(0);
    expect(queueHarness.storage.objects.size).toBe(0);

    const malwareHarness = new IsolatedAiHarness();
    malwareHarness.malwareScanner.failNextScan = true;
    await expect(malwareHarness.submit(await fixtureFile("arabic-cv.txt", "text/plain"))).rejects.toThrow("synthetic malware scanner failure");
    expect(malwareHarness.documents.size).toBe(0);

    const extractionHarness = new IsolatedAiHarness();
    const submission = await extractionHarness.submit(await fixtureFile("arabic-cv.txt", "text/plain"));
    if (submission.duplicate) throw new Error("unexpected duplicate fixture");
    await expect(extractionHarness.extract(submission.document.id, await fixtureFile("malformed-encoding.txt", "text/plain"))).rejects.toMatchObject({ code: "INVALID_FILE" });
    expect(extractionHarness.events.at(-1)?.state).toBe("EXTRACTION_FAILED");

    await extractionHarness.retentionExecutor.deleteDocument(submission.document, extractionHarness.storage);
    expect(await extractionHarness.storage.exists(submission.document.storageKey)).toBe(false);
  });

  it("keeps production activation off, RBAC server semantics, and public data isolated", async () => {
    expect(AI_PRODUCTION_ENABLED).toBe(false);
    expect(getAiProductionActivationState()).toBe("DISABLED");
    expect(hasAdminPermission("ADMIN", "ai.generation.create")).toBe(true);
    expect(hasAdminPermission("SUPER_ADMIN", "ai.generation.create")).toBe(true);
    expect(hasAdminPermission("EDITOR", "ai.generation.create")).toBe(false);
    expect(hasAdminPermission("MODERATOR", "ai.generation.create")).toBe(false);
    expect(hasAdminPermission("EDITOR", "ai.review")).toBe(true);
    expect(hasAdminPermission("MODERATOR", "ai.review")).toBe(false);

    const capabilities = getAiWorkspaceCapabilities();
    expect(capabilities.inference).toBe("DISABLED");
    expect(capabilities.productionUpload).toBe("DISABLED");
    expect(capabilities.publicProjection).toBe("DISABLED");

    const appRoot = resolve(process.cwd(), "app");
    const appFiles = await readdir(appRoot, { recursive: true });
    const publicFiles = appFiles.filter((file) => (file.endsWith(".ts") || file.endsWith(".tsx")) && !file.includes("admin"));
    const publicSource = (await Promise.all(publicFiles.map((file) => readFile(resolve(appRoot, file), "utf8")))).join("\n");
    expect(publicSource).not.toMatch(/@\/lib\/ai|ai_documents|ai_generation|ai-private|DOCUMENT_DATA_BEGIN|bearer\s+[a-z0-9._-]{16,}|sk-[a-z0-9]{16,}/iu);
    const migrationFiles = ["0007_phase17_16_media_architecture.sql", "0008_phase17_18_2_ai_ingestion_review.sql", "0009_phase17_18_4_ai_generation.sql"];
    const migrationSource = (await Promise.all(migrationFiles.map((file) => readFile(resolve(process.cwd(), "drizzle/migrations", file), "utf8")))).join("\n");
    expect(migrationSource).not.toMatch(/\b(?:blob|bytea|base64)\b/iu);
    expect((await readFile(resolve(process.cwd(), "app/api/admin/ai/documents/route.ts"), "utf8"))).toContain("AI_PRODUCTION_ENABLED");
    expect((await readFile(resolve(process.cwd(), "app/api/admin/ai/documents/[id]/generation/route.ts"), "utf8"))).toContain("AI_PRODUCTION_ENABLED");
    expect(unconfiguredAiGenerationProvider.status).toBe("NOT_CONFIGURED");
  });

  it("records only safe observability fields and never raw document/prompt/provider content", async () => {
    const { harness, document } = await preparedHarness();
    const raw = document.extraction?.normalizedText ?? "";
    const prompt = buildGenerationPrompt(generationInput(document.id), "BIOGRAPHY", "ARABIC");
    const job = harness.createGenerationJob(document.id, "BIOGRAPHY", "ARABIC").job;
    await harness.executeGeneration(job, createMockProvider("valid"));
    const eventText = JSON.stringify(harness.events);
    expect(eventText).not.toContain(raw);
    expect(eventText).not.toContain(prompt.messages[1]?.content ?? "DOCUMENT_DATA_BEGIN");
    expect(eventText).not.toContain("isolated-deterministic-model response");
    expect(harness.events.every((event) => typeof event.entityId === "string" && typeof event.state === "string" && typeof event.durationMs === "number")).toBe(true);
  });
});
