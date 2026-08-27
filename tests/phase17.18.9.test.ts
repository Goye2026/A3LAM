import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import {
  AI_FEATURE_GATES,
  AI_GENERATION_ENABLED,
  AI_OCR_ENABLED,
  AI_PROCESSING_ENABLED,
  AI_PRODUCTION_ENABLED,
  AI_PUBLICATION_ENABLED,
  AI_UPLOAD_ENABLED,
  assertAiProductionEnabled,
  getAiProductionActivationState,
} from "@/lib/ai/activation";
import { buildProviderSafePayload, assertProviderSafePayload } from "@/lib/ai/operations";
import { getAiRetentionReadiness } from "@/lib/ai/retention";
import { unconfiguredAiGenerationProvider } from "@/lib/ai/provider";
import { buildGenerationPrompt, promptContainsInstructionLikeText } from "@/lib/ai/generation/prompt";
import { createGenerationRequest, runGeneration } from "@/lib/ai/generation/orchestrator";
import type { AiGenerationInput, AiGenerationLanguage, AiGenerationMode, AiProvider } from "@/lib/ai/types";
import {
  assertSandboxOnly,
  DeterministicSandboxScanner,
  productionContractSnapshot,
  SandboxDraftBoundary,
  SandboxOperationsGate,
  SandboxPrivateStorage,
  SandboxProcessingQueue,
  SandboxRetentionController,
  SandboxTelemetry,
  SANDBOX_ISOLATION,
  reviewSandboxFact,
  type SandboxFact,
} from "./support/phase17.18.9-harness";
import {
  buildSyntheticInput,
  buildSyntheticProvenance,
  createMockProvider,
  IsolatedAiHarness,
  type MockProviderBehavior,
} from "./support/phase17.18.5-harness";
import { hasAdminPermission } from "@/lib/admin/rbac";

const fixturePath = (name: string) => resolve(process.cwd(), "fixtures/ai", name);

async function fixtureFile(name: string, type: string) {
  return new File([await readFile(fixturePath(name))], name, { type });
}

function generationInput(documentId: string, overrides: Partial<AiGenerationInput> = {}): AiGenerationInput {
  return { ...buildSyntheticInput(documentId), ...overrides };
}

async function runBehavior(behavior: MockProviderBehavior, input = generationInput(`phase-17-18-9-${behavior}`)) {
  const request = createGenerationRequest(`sandbox-${behavior}`, "PROFESSIONAL_PROFILE", "ARABIC", input);
  return runGeneration(request, createMockProvider(behavior));
}

describe("Phase 17.18.9 controlled AI activation sandbox", () => {
  it("proves test-only isolation and keeps every Production AI gate OFF", () => {
    expect(assertSandboxOnly()).toBe(true);
    expect(SANDBOX_ISOLATION).toMatchObject({ database: "IN_MEMORY_ONLY", productionDatabase: false, network: false, realProvider: false, realStorage: false, realScanner: false, realQueue: false });
    expect(AI_PRODUCTION_ENABLED).toBe(false);
    expect(AI_UPLOAD_ENABLED).toBe(false);
    expect(AI_PROCESSING_ENABLED).toBe(false);
    expect(AI_GENERATION_ENABLED).toBe(false);
    expect(AI_OCR_ENABLED).toBe(false);
    expect(AI_PUBLICATION_ENABLED).toBe(false);
    expect(AI_FEATURE_GATES).toEqual({ AI_UPLOAD_ENABLED: false, AI_PROCESSING_ENABLED: false, AI_GENERATION_ENABLED: false, AI_OCR_ENABLED: false, AI_PUBLICATION_ENABLED: false });
    expect(getAiProductionActivationState()).toBe("DISABLED");
    expect(() => assertAiProductionEnabled()).toThrow("disabled");
    expect(unconfiguredAiGenerationProvider.status).toBe("NOT_CONFIGURED");
    expect(productionContractSnapshot().productionMutations).toBe(0);
  });

  it("executes explicit SAFE/INFECTED/SCAN_ERROR/UNAVAILABLE scanner states and blocks non-safe input", () => {
    const scanner = new DeterministicSandboxScanner();
    expect(scanner.assertSafe(new TextEncoder().encode("synthetic clean document")).status).toBe("SAFE");
    expect(() => scanner.assertSafe(new TextEncoder().encode("EICAR-SYNTHETIC-TEST"))).toThrow("SCAN_INFECTED");
    for (const status of ["SCAN_ERROR", "UNAVAILABLE"] as const) {
      scanner.status = status;
      expect(() => scanner.assertSafe(new TextEncoder().encode("synthetic document"))).toThrow(`SCAN_${status}`);
    }
    expect(scanner.records.map((record) => record.status)).toEqual(["SAFE", "INFECTED", "SCAN_ERROR", "UNAVAILABLE"]);
  });

  it("enforces owner-isolated private storage, safe keys, detach/delete and no public URL", async () => {
    const storage = new SandboxPrivateStorage();
    const ownerA = { ownerType: "ADMIN_IDENTITY" as const, ownerId: "sandbox-owner-a" };
    const ownerB = { ownerType: "ADMIN_IDENTITY" as const, ownerId: "sandbox-owner-b" };
    const ownerDigest = createHash("sha256").update(`${ownerA.ownerType}:${ownerA.ownerId}`).digest("hex");
    const checksum = "b".repeat(64);
    const key = `ai-private/${ownerDigest}/${checksum}.txt`;
    const bytes = new TextEncoder().encode("synthetic private bytes");
    await storage.put(ownerA, { key, documentType: "txt", mimeType: "text/plain", sizeBytes: bytes.byteLength }, bytes);
    expect(new TextDecoder().decode(await storage.getForOwner(ownerA, key))).toBe("synthetic private bytes");
    expect(await storage.getMetadataForOwner(ownerA, key)).toMatchObject({ key, sizeBytes: bytes.byteLength });
    expect(await storage.existsForOwner(ownerB, key)).toBe(false);
    await expect(storage.getForOwner(ownerB, key)).rejects.toThrow("PRIVATE_OBJECT_NOT_FOUND");
    for (const invalid of ["public/file.txt", "ai-private/../escape.txt", "/ai-private/a", `ai-private/${ownerDigest}/../${checksum}.txt`, `ai-private/${ownerDigest}/${checksum}.exe`]) {
      await expect(storage.getForOwner(ownerA, invalid)).rejects.toThrow("PRIVATE_KEY_INVALID");
    }
    expect(storage.detach(key)).toBe(true);
    expect(await storage.existsForOwner(ownerA, key)).toBe(false);
    await expect(storage.createSignedRetrieval()).rejects.toThrow("SIGNED_PUBLIC_URL_DISABLED");
    await storage.put(ownerA, { key, documentType: "txt", mimeType: "text/plain", sizeBytes: bytes.byteLength }, bytes);
    await storage.deleteForOwner(ownerA, key);
    expect(storage.objects.has(key)).toBe(false);
    expect(await storage.existsForOwner(ownerA, key)).toBe(false);
  });

  it("supports queue enqueue/dequeue/delivery idempotency and prevents duplicate worker execution", async () => {
    const queue = new SandboxProcessingQueue();
    const first = queue.enqueue({ id: "queue-job-1", idempotencyKey: "doc-1:extract" });
    const duplicate = queue.enqueue({ id: "queue-job-duplicate", idempotencyKey: "doc-1:extract" });
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    let calls = 0;
    let release!: () => void;
    const hold = new Promise<void>((resolveHold) => { release = resolveHold; });
    const worker = async () => { calls += 1; await hold; };
    const deliveryOne = queue.deliver("queue-job-1", worker);
    const deliveryTwo = queue.deliver("queue-job-1", worker);
    release();
    await expect(Promise.all([deliveryOne, deliveryTwo])).resolves.toEqual(["SUCCEEDED", "SUCCEEDED"]);
    expect(calls).toBe(1);
    expect(queue.deliveries).toEqual(["queue-job-1"]);
    expect(queue.dequeue("queue-job-1")).toBeNull();
  });

  it("records retry/backoff, three-attempt exhaustion, stale jobs and unavailable workers", async () => {
    const queue = new SandboxProcessingQueue();
    queue.enqueue({ id: "retry-job", idempotencyKey: "retry-key" });
    const failure = async () => { throw new Error("TRANSIENT_FAILURE"); };
    await expect(queue.deliver("retry-job", failure, 0)).resolves.toBe("RETRYABLE");
    expect(queue.jobs.get("retry-job")).toMatchObject({ attempts: 1, availableAt: 1_000, status: "RETRYABLE" });
    await expect(queue.deliver("retry-job", failure, 1_000)).resolves.toBe("RETRYABLE");
    expect(queue.jobs.get("retry-job")).toMatchObject({ attempts: 2, availableAt: 3_000, status: "RETRYABLE" });
    await expect(queue.deliver("retry-job", failure, 3_000)).resolves.toBe("FAILED");
    expect(queue.jobs.get("retry-job")).toMatchObject({ attempts: 3, status: "FAILED" });

    queue.enqueue({ id: "stale-job", idempotencyKey: "stale-key" });
    expect(queue.dequeue("stale-job", 0)?.status).toBe("RUNNING");
    expect(queue.recoverStale(5 * 60_000)).toEqual(["stale-job"]);
    expect(queue.jobs.get("stale-job")).toMatchObject({ status: "FAILED", errorCode: "STALE_JOB" });

    const unavailable = new SandboxProcessingQueue();
    unavailable.workerAvailable = false;
    expect(() => unavailable.enqueue({ id: "unavailable-job", idempotencyKey: "unavailable-key" })).toThrow("QUEUE_WORKER_UNAVAILABLE");
  });

  it("runs actual local TXT/PDF/DOCX extraction and preserves bounded failure behavior", async () => {
    for (const [name, mime] of [["arabic-cv.txt", "text/plain"], ["sample.pdf", "application/pdf"], ["sample.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]] as const) {
      const harness = new IsolatedAiHarness();
      const file = await fixtureFile(name, mime);
      const submission = await harness.submit(file);
      expect(submission.duplicate).toBe(false);
      const extraction = await harness.extract(submission.document.id, file);
      expect(extraction.status).toBe("COMPLETED");
      expect(extraction.checksumSha256).toBe(submission.document.input.checksumSha256);
      expect(extraction.provenance.sourceType).toBe("document");
    }
    const negativeHarness = new IsolatedAiHarness();
    await expect(negativeHarness.submit(new File(["x"], "../escape.txt", { type: "text/plain" }))).rejects.toThrow();
    await expect(negativeHarness.submit(new File(["x"], "unsupported.exe", { type: "application/octet-stream" }))).rejects.toThrow();
    const malformedPdf = await negativeHarness.submit(await fixtureFile("malformed.pdf", "application/pdf"));
    await expect(negativeHarness.extract(malformedPdf.document.id, await fixtureFile("malformed.pdf", "application/pdf"))).rejects.toThrow();
    await expect(negativeHarness.submit(await fixtureFile("malformed.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).rejects.toMatchObject({ code: "DOCX_INVALID" });
    const suspiciousDocx = await negativeHarness.submit(await fixtureFile("suspicious.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    await expect(negativeHarness.extract(suspiciousDocx.document.id, await fixtureFile("suspicious.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).rejects.toMatchObject({ code: "DOCX_UNSAFE_ARCHIVE" });
    await expect(negativeHarness.submit(await fixtureFile("empty.txt", "text/plain"))).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" });
    const imagePdf = await negativeHarness.submit(await fixtureFile("empty.pdf", "application/pdf"));
    await expect(negativeHarness.extract(imagePdf.document.id, await fixtureFile("empty.pdf", "application/pdf"))).rejects.toMatchObject({ code: "OCR_REQUIRED" });
    await expect(negativeHarness.submit(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "oversized.txt", { type: "text/plain" }))).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("supports fact human review actions with provenance, confidence and classification retained", () => {
    const actions = ["ACCEPT", "EDIT", "REJECT", "REQUEST_SOURCE"] as const;
    for (const action of actions) {
      const fact: SandboxFact = { id: `fact-${action}`, fieldPath: "professional.headline", value: "Original synthetic value", reviewStatus: "UNREVIEWED", provenance: buildSyntheticProvenance(`document-${action}`) };
      const decision = reviewSandboxFact(fact, action, "sandbox-editor", action === "EDIT" ? "Edited synthetic value" : undefined);
      expect(decision.originalValue).toBe("Original synthetic value");
      expect(fact.provenance.length).toBeGreaterThan(0);
      expect(fact.reviewStatus).toBe(action === "ACCEPT" ? "ACCEPTED" : action === "EDIT" ? "EDITED" : action === "REJECT" ? "REJECTED" : "REQUEST_SOURCE");
      if (action === "EDIT") expect(fact.value).toBe("Edited synthetic value");
    }
  });

  it("covers every mock generation mode/language and keeps all outcomes behind the DRAFT gate", async () => {
    const modes: AiGenerationMode[] = ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"];
    const languages: AiGenerationLanguage[] = ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"];
    for (const mode of modes) {
      for (const language of languages) {
        const request = createGenerationRequest(`matrix-${mode}-${language}`, mode, language, generationInput(`matrix-${mode}-${language}`));
        const result = await runGeneration(request, createMockProvider("valid"));
        expect(result.status).toBe("SUCCEEDED");
        expect(result.draftStatus).toBe("DRAFT");
        expect(result.qualityGate).toBe("PASS_WITH_REVIEW");
      }
    }
    await expect(runBehavior("timeout")).resolves.toMatchObject({ status: "FAILED", qualityGate: "REJECTED" });
    await expect(runBehavior("provider-failure")).resolves.toMatchObject({ status: "FAILED", qualityGate: "REJECTED" });
    await expect(runBehavior("malformed")).resolves.toMatchObject({ status: "FAILED", qualityGate: "REJECTED", errorCode: "INVALID_OUTPUT" });
    await expect(runBehavior("missing-evidence")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "PASS_WITH_REVIEW", errorCode: "REVIEW_REQUIRED" });
    await expect(runBehavior("unsupported-claims")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "INVALID_OUTPUT" });
    await expect(runBehavior("secret-like")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "PRIVACY_BLOCKED" });
    await expect(runBehavior("instruction-like")).resolves.toMatchObject({ status: "SUCCEEDED", qualityGate: "REJECTED", errorCode: "PRIVACY_BLOCKED" });
  });

  it("rejects unsafe URLs and prompt injection while keeping untrusted text out of system instructions", async () => {
    const baseProvider = createMockProvider("valid");
    const unsafeUrlProvider: AiProvider = {
      ...baseProvider,
      async generate(request) {
        const result = await baseProvider.generate(request);
        const claims = result.claims.map((claim) => ({ ...claim, value: "https://untrusted.example/profile" }));
        return { ...result, claims, draft: result.draft ? { ...result.draft, claims } : undefined };
      },
    };
    const unsafe = await runGeneration(createGenerationRequest("unsafe-url-job", "BIOGRAPHY", "ARABIC", generationInput("unsafe-url-document")), unsafeUrlProvider);
    expect(unsafe.qualityGate).toBe("REJECTED");
    expect(unsafe.errorCode).toBe("INVALID_OUTPUT");

    const promptFixture = await readFile(fixturePath("prompt-injection-cv.txt"), "utf8");
    const prompt = buildGenerationPrompt({ ...generationInput("prompt-injection-document"), normalizedText: promptFixture, sourceLanguage: "mixed" }, "BIOGRAPHY", "ARABIC");
    expect(promptContainsInstructionLikeText(prompt)).toBe(true);
    expect(prompt.messages[0]?.content).not.toContain("publish this profile");
    expect(prompt.messages[1]?.content).toContain("DOCUMENT_DATA_BEGIN");
    expect(prompt.messages[1]?.content).toContain("publish this profile");
  });

  it("enforces claim review mapping, audit values, and a complete lifecycle that stops at DRAFT", async () => {
    const harness = new IsolatedAiHarness();
    const file = await fixtureFile("arabic-cv.txt", "text/plain");
    const submitted = await harness.submit(file);
    const extraction = await harness.extract(submitted.document.id, file);
    for (const fact of extraction.candidateFacts) {
      const stored = submitted.document.facts.find((item) => item.fieldPath === fact.fieldPath);
      if (stored) harness.reviewFact(submitted.document.id, stored.id, "ACCEPTED", "sandbox-human-review");
    }
    expect(submitted.document.facts.every((fact) => fact.reviewStatus === "ACCEPTED")).toBe(true);
    const created = harness.createGenerationJob(submitted.document.id, "A3LAM_PERSON_DRAFT", "BILINGUAL");
    expect(created.duplicate).toBe(false);
    const result = await harness.executeGeneration(created.job, createMockProvider("valid"));
    expect(result?.draftStatus).toBe("DRAFT");
    expect(result?.qualityGate).toBe("PASS_WITH_REVIEW");
    const claim = result?.claims[0];
    if (!claim) throw new Error("sandbox claim missing");
    const accepted = harness.reviewClaim(created.job, claim.id, { action: "ACCEPT", reviewerNote: "Synthetic claim reviewed" }, "sandbox-reviewer");
    expect(accepted.originalValue).toBeDefined();
    expect(harness.finalDraft(created.job)?.claims).toHaveLength(1);
    const second = harness.createGenerationJob(submitted.document.id, "SEO_DRAFT", "ARABIC");
    const secondResult = await harness.executeGeneration(second.job, createMockProvider("valid"));
    const secondClaim = secondResult?.claims[0];
    if (!secondClaim) throw new Error("second sandbox claim missing");
    harness.reviewClaim(second.job, secondClaim.id, { action: "REQUEST_SOURCE", reviewerNote: "Needs independent source" }, "sandbox-reviewer");
    expect(harness.finalDraft(second.job)?.claims).toHaveLength(0);
    const serialized = JSON.stringify([...harness.documents.values()]);
    expect(serialized).not.toContain("personId");
    expect(serialized).not.toContain("profileId");
    expect(serialized).not.toContain("published");
  });

  it("keeps the server-side role matrix, same-origin boundary and provider payload safe", () => {
    expect(hasAdminPermission("ADMIN", "ai.generation.create")).toBe(true);
    expect(hasAdminPermission("SUPER_ADMIN", "ai.generation.create")).toBe(true);
    expect(hasAdminPermission("EDITOR", "ai.generation.create")).toBe(false);
    expect(hasAdminPermission("MODERATOR", "ai.generation.create")).toBe(false);
    expect(hasAdminPermission("EDITOR", "ai.review")).toBe(true);
    expect(hasAdminPermission("MODERATOR", "ai.review")).toBe(false);

    const safePayload = buildProviderSafePayload({ normalizedSourceText: "synthetic", approvedFacts: [{ fieldPath: "name", value: "Synthetic Person", evidenceIds: ["evidence-1"] }], selectedEvidenceIds: ["evidence-1"], mode: "BIOGRAPHY", outputLanguage: "ARABIC" });
    expect(() => assertProviderSafePayload(safePayload)).not.toThrow();
    expect(() => assertProviderSafePayload({ ...safePayload, providerSecrets: "must-not-cross-boundary" })).toThrow("Forbidden provider field");

    const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://a3-lam.vercel.app";
    try {
      expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/admin/ai/documents", { headers: { origin: "https://a3-lam.vercel.app" } }))).toBe(true);
      expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/admin/ai/documents", { headers: { origin: "https://evil.example" } }))).toBe(false);
      expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/admin/ai/documents"))).toBe(true);
    } finally {
      if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    }
  });

  it("executes rate, concurrency and cost policy limits deterministically", () => {
    const gate = new SandboxOperationsGate();
    for (let index = 0; index < 20; index += 1) gate.consume("ADMIN", "upload");
    expect(() => gate.consume("ADMIN", "upload")).toThrow("RATE_LIMITED");
    expect(() => gate.consume("EDITOR", "upload")).toThrow("RATE_LIMITED");
    expect(gate.acquireConcurrency()).toBe(1);
    expect(gate.acquireConcurrency()).toBe(2);
    expect(() => gate.acquireConcurrency()).toThrow("CONCURRENCY_LIMITED");
    gate.releaseConcurrency();
    expect(gate.snapshot()).toMatchObject({ activeJobs: 1, maxConcurrentJobs: 2, maxRetries: 3 });
    gate.releaseConcurrency();
    expect(gate.snapshot().activeJobs).toBe(0);
    expect(productionContractSnapshot().operations.rateLimits.distributedEnforcement).toBe("REQUIRES_CONFIGURATION");
    expect(productionContractSnapshot().operations.costControls.pricingSource).toBe("REQUIRES_CONFIGURATION");
  });

  it("evaluates retention without claiming automatic execution and records redacted telemetry only", async () => {
    const storage = new SandboxPrivateStorage();
    const retention = new SandboxRetentionController();
    const ownerA = { ownerType: "ADMIN_IDENTITY" as const, ownerId: "retention-owner-a" };
    const ownerB = { ownerType: "ADMIN_IDENTITY" as const, ownerId: "retention-owner-b" };
    const keyFor = (owner: typeof ownerA, checksum: string) => `ai-private/${createHash("sha256").update(`${owner.ownerType}:${owner.ownerId}`).digest("hex")}/${checksum}.txt`;
    const keyA = keyFor(ownerA, "a".repeat(64));
    const keyB = keyFor(ownerB, "b".repeat(64));
    await storage.put(ownerA, { key: keyA, documentType: "txt", mimeType: "text/plain", sizeBytes: 1 }, new Uint8Array([1]));
    await storage.put(ownerB, { key: keyB, documentType: "txt", mimeType: "text/plain", sizeBytes: 1 }, new Uint8Array([2]));
    expect(retention.evaluate(0, 30 * 24 * 60 * 60 * 1000)).toBe("ELIGIBLE");
    expect(await retention.executeAutomatic()).toEqual({ executed: false, reason: "EXECUTOR_NOT_CONFIGURED" });
    expect(getAiRetentionReadiness()).toMatchObject({ status: "REQUIRES_CONFIGURATION", deletionExecuted: false });
    await retention.deleteOwnedDocument(storage, ownerA, keyA);
    expect(await storage.existsForOwner(ownerA, keyA)).toBe(false);
    expect(await storage.existsForOwner(ownerB, keyB)).toBe(true);

    const telemetry = new SandboxTelemetry();
    telemetry.record({ correlationId: "corr-1", jobId: "job-1", documentId: "doc-1", stage: "GENERATION", status: "SUCCEEDED", durationMs: 1, attempt: 1, errorClass: null, rawContent: "PRIVATE RAW DOCUMENT", prompt: "DOCUMENT_DATA_BEGIN secret", providerResponse: "private provider output" });
    const eventText = JSON.stringify(telemetry.events);
    expect(eventText).not.toContain("PRIVATE RAW DOCUMENT");
    expect(eventText).not.toContain("DOCUMENT_DATA_BEGIN");
    expect(eventText).not.toContain("private provider output");
    expect(telemetry.events[0]).toMatchObject({ correlationId: "corr-1", stage: "GENERATION", attempt: 1 });
  });

  it("blocks publication, Person and Profile creation even after a successful sandbox draft", () => {
    const boundary = new SandboxDraftBoundary();
    expect(boundary.createDraft("draft-1", "BIOGRAPHY", "ARABIC")).toMatchObject({ status: "DRAFT" });
    expect(() => boundary.publish()).toThrow("PUBLICATION_BLOCKED_DRAFT_ONLY");
    expect(() => boundary.createPerson()).toThrow("PERSON_CREATION_BLOCKED");
    expect(() => boundary.createProfile()).toThrow("PROFILE_CREATION_BLOCKED");
    expect(boundary.publicationAttempts).toBe(1);
    expect(boundary.personCreationAttempts).toBe(1);
    expect(boundary.profileCreationAttempts).toBe(1);
    expect(productionContractSnapshot()).toMatchObject({ productionMutations: 0, providerCalls: 0, uploads: 0, migrations: 0 });
  });
});
