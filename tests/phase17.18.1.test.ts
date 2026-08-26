import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAiAuditLogInput } from "@/lib/ai/audit";
import { createStructuredFact, validateProvenance } from "@/lib/ai/facts";
import { documentIngestionService, DocumentExtractionUnavailableError } from "@/lib/ai/ingestion";
import { getAiProviderState, unavailableAiProvider } from "@/lib/ai/provider";
import { createHumanReviewWorkspace } from "@/lib/ai/review";
import { getAiWorkspaceCapabilities, getAiWorkspaceSnapshot } from "@/lib/ai/workspace";
import { validateAiDocument, normalizeExtractedText, AiDocumentValidationError } from "@/lib/ai/validation";

const provenance = [{ sourceType: "document" as const, documentId: "doc-1", fileName: "cv.txt", page: 1, excerpt: "نبذة قصيرة" }];

afterEach(() => vi.unstubAllEnvs());

describe("Phase 17.18.1 AI document foundation", () => {
  it("validates a UTF-8 TXT document and normalizes extracted text", async () => {
    const file = new File(["  الاسم\r\n\r\n\r\nالمهنة  "], "cv.txt", { type: "text/plain" });
    const validated = await validateAiDocument(file);
    expect(validated.documentType).toBe("txt");
    expect(validated.originalName).toBe("cv.txt");
    expect(normalizeExtractedText(new TextDecoder().decode(validated.bytes))).toBe("الاسم\n\nالمهنة");
    const extracted = await documentIngestionService.extract(file);
    expect(extracted.metadata.extractor).toBe("deterministic-utf8-text");
    expect(extracted.normalizedText).toBe("الاسم\n\nالمهنة");
  });

  it("rejects empty, mismatched, HTML-like, and malformed documents", async () => {
    await expect(validateAiDocument(new File([], "empty.txt", { type: "text/plain" }))).rejects.toBeInstanceOf(AiDocumentValidationError);
    await expect(validateAiDocument(new File(["hello"], "note.pdf", { type: "application/pdf" }))).rejects.toBeInstanceOf(AiDocumentValidationError);
    await expect(validateAiDocument(new File(["<script>alert(1)</script>"], "note.txt", { type: "text/plain" }))).rejects.toBeInstanceOf(AiDocumentValidationError);
    await expect(validateAiDocument(new File(["not-a-docx"], "note.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))).rejects.toBeInstanceOf(AiDocumentValidationError);
  });

  it("does not pretend PDF/DOCX extraction is available", async () => {
    const pdf = new File(["%PDF-1.7\n%%EOF"], "document.pdf", { type: "application/pdf" });
    await expect(documentIngestionService.extract(pdf)).rejects.toBeInstanceOf(DocumentExtractionUnavailableError);
  });
});

describe("Phase 17.18.1 structured facts and review contracts", () => {
  it("requires bounded provenance and uses classification confidence, not probabilities", () => {
    const fact = createStructuredFact("باحث", provenance, "medium", "EXTRACTED");
    expect(fact.confidence).toBe("medium");
    expect(fact.classification).toBe("EXTRACTED");
    expect(() => validateProvenance([{ sourceType: "document", excerpt: "x".repeat(501) }])).toThrow(/مقتطف/);
    expect(() => createStructuredFact("استنتاج", [], "low", "AI_INFERRED")).toThrow(/مصدرًا/);
  });

  it("flattens facts for human review and keeps the result as DRAFT", () => {
    const draft = { identity: { fullName: createStructuredFact("اسم", provenance), alternateNames: [] }, professional: { profession: [], fields: [] }, education: [], career: [], achievements: [], awards: [], publications: [], skills: [], languages: [], links: [], sources: [] };
    const workspace = createHumanReviewWorkspace(draft);
    expect(workspace.draftStatus).toBe("DRAFT");
    expect(workspace.state).toBe("NOT_STARTED");
    expect(workspace.facts[0]?.fieldPath).toBe("identity.fullName");
    expect(workspace.facts[0]?.allowedActions).toContain("MARK_FOR_VERIFICATION");
  });
});

describe("Phase 17.18.1 provider and audit contracts", () => {
  it("reports provider configuration honestly and never fabricates a response", async () => {
    expect(getAiProviderState()).toBe("REQUIRES_CONFIGURATION");
    vi.stubEnv("A3LAM_AI_PROVIDER_URL", "http://example.com/provider");
    vi.stubEnv("A3LAM_AI_PROVIDER_TOKEN", "configured-token");
    expect(getAiProviderState()).toBe("INVALID_CONFIGURATION");
    vi.unstubAllEnvs();
    vi.stubEnv("A3LAM_AI_PROVIDER_URL", "https://example.com/provider");
    vi.stubEnv("A3LAM_AI_PROVIDER_TOKEN", "configured-token");
    expect(getAiProviderState()).toBe("REQUIRES_CONFIGURATION");
    vi.unstubAllEnvs();
    await expect(unavailableAiProvider.run({ operation: "extractProfile", outputType: "DATA_EXTRACTION", input: { metadata: { documentType: "txt", originalName: "x.txt", mimeType: "text/plain", sizeBytes: 1, extractedAt: "2026-01-01T00:00:00.000Z", extractor: "test" }, normalizedText: "x" } })).rejects.toThrow(/requires configuration/);
  });

  it("keeps workspace counters unavailable without persistence", () => {
    const snapshot = getAiWorkspaceSnapshot();
    expect(snapshot.persistence).toBe("NOT_INITIALIZED");
    expect(snapshot.counts).toBeNull();
    expect(snapshot.provider).toBe("REQUIRES_CONFIGURATION");
    expect(getAiWorkspaceCapabilities().supportedTypes).toEqual(["pdf", "docx", "txt"]);
  });

  it("maps AI audit events to the existing audit log shape", () => {
    const result = buildAiAuditLogInput({ action: "ai.document.submitted", actorType: "admin", actorId: "admin-1", entityType: "ai_document", entityId: "doc-1", reason: "manual submission" }, "audit-1");
    expect(result).toEqual(expect.objectContaining({ id: "audit-1", action: "ai.document.submitted", entityType: "ai_document", field: "", oldValue: null, newValue: null }));
  });
});
