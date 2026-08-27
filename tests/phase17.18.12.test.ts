import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDraftIntegrity,
  createEmptyWorkflowSnapshot,
  evaluateWorkflowQualityGate,
  getAllowedWorkflowStates,
  isPublicationState,
  transitionWorkflow,
  type WorkflowClaim,
  type WorkflowFact,
  type WorkflowSnapshot,
} from "@/lib/ai/workflowIntegrity";

const read = (relativePath: string) => readFile(resolve(process.cwd(), relativePath), "utf8");
const actor = { id: "synthetic-editor", authenticated: true, permission: "ai.workflow.write" } as const;

function fact(overrides: Partial<WorkflowFact> = {}): WorkflowFact {
  return { id: "fact-1", critical: true, hasEvidence: true, hasProvenance: true, review: "ACCEPTED", originalValue: "1910", reviewedValue: "1910", reviewerId: "editor-1", reviewedAt: "2026-08-27T00:00:00.000Z", ...overrides };
}

function claim(overrides: Partial<WorkflowClaim> = {}): WorkflowClaim {
  return { id: "claim-1", critical: true, sourceFactIds: ["fact-1"], evidenceIds: ["evidence-1"], provenance: [{ sourceType: "document", documentId: "doc-1", excerpt: "1910" }], status: "ACCEPTED", reviewerId: "editor-1", reviewedAt: "2026-08-27T00:00:00.000Z", ...overrides };
}

function readySnapshot(): WorkflowSnapshot {
  return {
    ...createEmptyWorkflowSnapshot("synthetic-workspace"),
    state: "DRAFT_REVIEWED",
    revision: 10,
    document: { id: "doc-1", valid: true },
    extraction: { status: "SUCCEEDED", candidateFactCount: 1 },
    facts: [fact()],
    generation: { mode: "A3LAM_PERSON_DRAFT", outputLanguage: "ARABIC", jobId: "job-1", attemptId: "attempt-1", jobValid: true, outputValid: true, draftStatus: "DRAFT" },
    claims: [claim()],
    unresolvedConflicts: [],
    qualityGate: "PASS",
    draft: buildDraftIntegrity({ generationJobId: "job-1", generationAttemptId: "attempt-1", sourceDocumentId: "doc-1", sourceLanguage: "ar", outputLanguage: "ARABIC", generationMode: "A3LAM_PERSON_DRAFT", createdAt: "2026-08-27T00:00:00.000Z", provenance: [{ sourceType: "document", documentId: "doc-1" }], claims: [claim()], unresolvedConflicts: [] }),
  };
}

describe("Phase 17.18.12 workflow integrity", () => {
  it("enforces the ordered state machine and blocks direct or publication transitions", () => {
    const empty = createEmptyWorkflowSnapshot();
    const invalid = transitionWorkflow(empty, "GENERATING", { actor });
    expect(invalid).toMatchObject({ ok: false, code: "INVALID_TRANSITION" });
    expect(getAllowedWorkflowStates("EDITORIAL_DRAFT_READY")).toEqual([]);
    expect(isPublicationState("PUBLISHED")).toBe(true);
    expect(isPublicationState("DRAFT")).toBe(false);
  });

  it("requires server-side actor permission and optimistic revision matching", () => {
    const denied = transitionWorkflow(createEmptyWorkflowSnapshot(), "DOCUMENT_READY", { actor: { ...actor, authenticated: false } });
    expect(denied).toMatchObject({ ok: false, code: "PERMISSION_DENIED" });
    const stale = transitionWorkflow(createEmptyWorkflowSnapshot(), "DOCUMENT_READY", { actor, expectedRevision: 4 });
    expect(stale).toMatchObject({ ok: false, code: "STALE_REVISION", blockingFields: ["revision"] });
  });

  it("blocks missing evidence, request-source facts, unresolved conflicts and invalid generation output", () => {
    const snapshot = readySnapshot();
    expect(transitionWorkflow({ ...snapshot, state: "FACT_REVIEW_REQUIRED", facts: [fact({ review: "REQUEST_SOURCE" })], revision: 3 }, "FACTS_ACCEPTED", { actor, expectedRevision: 3 })).toMatchObject({ ok: false, code: "SOURCE_REQUIRED" });
    expect(transitionWorkflow({ ...snapshot, state: "FACTS_ACCEPTED", unresolvedConflicts: ["birthDate"], revision: 4 }, "GENERATION_READY", { actor, expectedRevision: 4 })).toMatchObject({ ok: false, code: "CONFLICT_UNRESOLVED" });
    expect(transitionWorkflow({ ...snapshot, state: "GENERATING", generation: { ...snapshot.generation, outputValid: false }, revision: 8 }, "DRAFT_READY", { actor, expectedRevision: 8 })).toMatchObject({ ok: false, code: "OUTPUT_INVALID" });
  });

  it("supports a valid deterministic journey while incrementing revision on every transition", () => {
    let snapshot = createEmptyWorkflowSnapshot("valid-journey");
    snapshot = { ...snapshot, document: { id: "doc-1", valid: true } };
    let result = transitionWorkflow(snapshot, "DOCUMENT_READY", { actor, expectedRevision: 0 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    snapshot = { ...snapshot, extraction: { status: "SUCCEEDED", candidateFactCount: 1 } };
    result = transitionWorkflow(snapshot, "EXTRACTED", { actor, expectedRevision: 1 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    result = transitionWorkflow({ ...snapshot, extraction: { status: "SUCCEEDED", candidateFactCount: 1 } }, "FACTS_READY", { actor, expectedRevision: 2 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = { ...result.snapshot, facts: [fact()] };
    result = transitionWorkflow(snapshot, "FACT_REVIEW_REQUIRED", { actor, expectedRevision: 3 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    result = transitionWorkflow(snapshot, "FACTS_ACCEPTED", { actor, expectedRevision: 4 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = { ...result.snapshot, generation: { mode: "BIOGRAPHY", outputLanguage: "ARABIC", jobId: "job-1", attemptId: "attempt-1", jobValid: true, outputValid: true, draftStatus: "NONE" } };
    result = transitionWorkflow(snapshot, "GENERATION_READY", { actor, expectedRevision: 5, hasRequiredEvidence: true });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    result = transitionWorkflow(snapshot, "GENERATING", { actor, expectedRevision: 6, generationJobValid: true });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = { ...result.snapshot, generation: { ...result.snapshot.generation, draftStatus: "DRAFT" }, claims: [claim()] };
    result = transitionWorkflow(snapshot, "DRAFT_READY", { actor, expectedRevision: 7, outputValidationPassed: true });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    result = transitionWorkflow(snapshot, "CLAIM_REVIEW_REQUIRED", { actor, expectedRevision: 8 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = result.snapshot;
    result = transitionWorkflow(snapshot, "DRAFT_REVIEWED", { actor, expectedRevision: 9 });
    expect(result.ok).toBe(true); if (!result.ok) return; snapshot = { ...result.snapshot, qualityGate: "PASS" };
    result = transitionWorkflow(snapshot, "EDITORIAL_DRAFT_READY", { actor, expectedRevision: 10 });
    expect(result).toMatchObject({ ok: true, snapshot: { state: "EDITORIAL_DRAFT_READY", revision: 11 } });
  });

  it("keeps draft metadata and claim provenance attached to the source", () => {
    const draft = readySnapshot().draft;
    expect(draft).toMatchObject({ generationJobId: "job-1", generationAttemptId: "attempt-1", sourceDocumentId: "doc-1", outputLanguage: "ARABIC", generationMode: "A3LAM_PERSON_DRAFT", reviewState: "CLAIM_REVIEW_REQUIRED", revision: 0 });
    expect(draft?.claims[0].sourceFactIds).toEqual(["fact-1"]);
    expect(draft?.claims[0].evidenceIds).toEqual(["evidence-1"]);
    expect(draft?.claims[0].provenance[0].documentId).toBe("doc-1");
  });

  it("returns deterministic quality gate reasons and never treats accepted as published", () => {
    const blocked = evaluateWorkflowQualityGate({ validDocument: true, extractionSucceeded: true, facts: [fact()], claims: [claim()], sourceCoverage: 1, outputValid: true, forbiddenContent: false, unsafeUrls: true, secretLikeOutput: false, draftStatus: "DRAFT", unresolvedConflicts: [] });
    expect(blocked).toMatchObject({ status: "BLOCKED", reasonCodes: ["UNSAFE_URL"], blockingFields: ["unsafeUrls"] });
    const pass = evaluateWorkflowQualityGate({ validDocument: true, extractionSucceeded: true, facts: [fact()], claims: [claim()], sourceCoverage: 1, outputValid: true, forbiddenContent: false, unsafeUrls: false, secretLikeOutput: false, draftStatus: "DRAFT", unresolvedConflicts: [] });
    expect(pass).toMatchObject({ status: "PASS", reasonCodes: [], blockingFields: [] });
    expect(readySnapshot().generation.draftStatus).toBe("DRAFT");
    expect(isPublicationState(readySnapshot().state)).toBe(false);
  });

  it("implements honest local recovery and no fake autosave in the UI", async () => {
    const source = await read("components/a3lam/ai/A3lamEditorialWorkspace.tsx");
    expect(source).toContain("window.localStorage.setItem");
    expect(source).toContain("window.localStorage.getItem");
    expect(source).toContain("window.localStorage.removeItem");
    expect(source).toContain("beforeunload");
    expect(source).toContain("adminAiSavedLocally");
    expect(source).toContain("adminAiLocalStateAvailable");
    expect(source).toContain("adminAiReviewNote");
    expect(source).toContain("aria-disabled={!unlocked}");
    expect(source).toContain("if (!unlocked) return");
    expect(source).not.toContain("setInterval");
    expect(source).not.toContain("autosave");
  });
});
