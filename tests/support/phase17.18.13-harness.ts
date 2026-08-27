import { createHash } from "node:crypto";
import { AI_COST_CONTROL_POLICY, AI_RATE_LIMIT_POLICY, buildProviderSafePayload } from "@/lib/ai/operations";
import { AI_QUEUE_DEFAULT_POLICY } from "@/lib/ai/queue";
import { buildDraftIntegrity, type WorkflowClaim, type WorkflowFact } from "@/lib/ai/workflowIntegrity";
import { isPrivateDocumentKey } from "@/lib/ai/privacy";
import type { AiGenerationRequest, AiGenerationResult, DocumentProvenance } from "@/lib/ai/types";
import type { SandboxOwner, SandboxPrivateStorage, SandboxRetentionController, SandboxTelemetry } from "./phase17.18.9-harness";

export const ISOLATED_INFRASTRUCTURE_EVIDENCE = Object.freeze({
  environment: "test-only-isolated-memory",
  database: "IN_MEMORY_EQUIVALENT",
  databaseMigrations: "NOT_TESTED",
  productionDatabase: false,
  productionConnectionUsed: false,
  network: false,
  realProvider: false,
  realStorage: false,
  realScanner: false,
  realQueue: false,
  realOcr: false,
});

export function assertIsolatedInfrastructure() {
  if (ISOLATED_INFRASTRUCTURE_EVIDENCE.databaseMigrations !== "NOT_TESTED" || ISOLATED_INFRASTRUCTURE_EVIDENCE.productionDatabase || ISOLATED_INFRASTRUCTURE_EVIDENCE.productionConnectionUsed || ISOLATED_INFRASTRUCTURE_EVIDENCE.network || ISOLATED_INFRASTRUCTURE_EVIDENCE.realProvider || ISOLATED_INFRASTRUCTURE_EVIDENCE.realStorage || ISOLATED_INFRASTRUCTURE_EVIDENCE.realScanner || ISOLATED_INFRASTRUCTURE_EVIDENCE.realQueue || ISOLATED_INFRASTRUCTURE_EVIDENCE.realOcr) throw new Error("ISOLATION_VIOLATION");
  return true as const;
}

export type IsolatedAudit = {
  id: string;
  stage: "DOCUMENT_CREATED" | "SCAN_COMPLETED" | "EXTRACTION_COMPLETED" | "FACT_REVIEWED" | "GENERATION_REQUESTED" | "GENERATION_COMPLETED" | "CLAIM_REVIEWED" | "DOCUMENT_DELETED" | "JOB_FAILED";
  entityId: string;
  documentId: string | null;
  jobId: string | null;
  attemptId: string | null;
  status: string;
  durationMs: number | null;
  errorClass: string | null;
};

export type IsolatedDocument = {
  id: string;
  owner: SandboxOwner;
  checksumSha256: string;
  storageKey: string;
  status: "DOCUMENT_CREATED" | "SCANNING" | "SAFE" | "EXTRACTING" | "EXTRACTED" | "FACTS_READY" | "FACT_REVIEW_REQUIRED" | "FACTS_ACCEPTED" | "GENERATION_READY" | "GENERATING" | "DRAFT_READY" | "CLAIM_REVIEW_REQUIRED" | "DRAFT_REVIEWED" | "EDITORIAL_DRAFT_READY" | "FAILED" | "DELETED";
  revision: number;
  retentionDueAt: number;
};

export type IsolatedProcessingJob = {
  id: string;
  documentId: string;
  idempotencyKey: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DEAD_LETTER";
  attempts: number;
  claimedBy: string | null;
};

export type IsolatedFact = WorkflowFact & {
  documentId: string;
  sourceId: string;
  value: unknown;
  evidenceIds: string[];
  provenance: DocumentProvenance[];
  revision: number;
};

export type IsolatedClaim = WorkflowClaim & {
  documentId: string;
  jobId: string;
  value: unknown;
  revision: number;
};

export type IsolatedCounters = {
  documents: number;
  processingJobs: number;
  extractionJobs: number;
  generationJobs: number;
  generationAttempts: number;
  claims: number;
  reviewDecisions: number;
  storageObjects: number;
  mockProviderCalls: number;
};

function id(prefix: string, value: string) {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function nowIso() { return new Date(0).toISOString(); }

export class IsolatedPersistenceEquivalent {
  readonly documents = new Map<string, IsolatedDocument>();
  readonly processingJobs = new Map<string, IsolatedProcessingJob>();
  readonly extractionSources = new Map<string, { id: string; documentId: string; text: string; extractor: string }>();
  readonly facts = new Map<string, IsolatedFact>();
  readonly evidence = new Map<string, { id: string; factId: string; excerpt: string; sourceUrl: string | null }>();
  readonly factReviews: Array<{ id: string; factId: string; action: "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE"; originalValue: unknown; reviewedValue: unknown; reviewerId: string; reviewerNote: string | null; revision: number }> = [];
  readonly generationJobs = new Map<string, { id: string; documentId: string; idempotencyKey: string; status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DEAD_LETTER"; attempts: number; qualityGate: "PENDING" | "PASS" | "PASS_WITH_REVIEW" | "REJECTED" }>();
  readonly generationAttempts = new Map<string, { id: string; jobId: string; attempt: number; status: string }>();
  readonly claims = new Map<string, IsolatedClaim>();
  readonly claimReviews: Array<{ id: string; claimId: string; action: "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE"; reviewerId: string; revision: number }> = [];
  readonly audits: IsolatedAudit[] = [];
  readonly storageKeys = new Set<string>();
  private readonly checksumIndex = new Map<string, string>();
  private readonly processingIdempotency = new Map<string, string>();
  private readonly generationIdempotency = new Map<string, string>();
  private readonly factReviewRevision = new Map<string, number>();
  private readonly claimReviewRevision = new Map<string, number>();

  createDocument(owner: SandboxOwner, checksumSha256: string, storageKey: string, retentionDueAt = 30 * 24 * 60 * 60 * 1000) {
    const checksumKey = `${owner.ownerType}:${owner.ownerId}:${checksumSha256}`;
    const duplicateId = this.checksumIndex.get(checksumKey);
    if (duplicateId) return { duplicate: true as const, document: this.documents.get(duplicateId)! };
    if (!isPrivateDocumentKey(storageKey)) throw new Error("PRIVATE_KEY_INVALID");
    const documentId = id("doc", checksumKey);
    const document: IsolatedDocument = { id: documentId, owner, checksumSha256, storageKey, status: "DOCUMENT_CREATED", revision: 0, retentionDueAt };
    this.documents.set(documentId, document);
    this.checksumIndex.set(checksumKey, documentId);
    this.storageKeys.add(storageKey);
    this.record({ stage: "DOCUMENT_CREATED", entityId: documentId, documentId, jobId: null, attemptId: null, status: "CREATED" });
    return { duplicate: false as const, document };
  }

  markScan(documentId: string, outcome: "SAFE" | "INFECTED" | "UNSCANNABLE" | "ERROR" | "TIMEOUT") {
    const document = this.requireDocument(documentId);
    if (outcome !== "SAFE") {
      document.status = "FAILED";
      this.record({ stage: "SCAN_COMPLETED", entityId: documentId, documentId, jobId: null, attemptId: null, status: outcome, errorClass: outcome });
      return false as const;
    }
    document.status = "SAFE";
    this.record({ stage: "SCAN_COMPLETED", entityId: documentId, documentId, jobId: null, attemptId: null, status: "SAFE" });
    return true as const;
  }

  startExtraction(documentId: string) {
    const document = this.requireDocument(documentId);
    if (document.status !== "SAFE") throw new Error("SCAN_REQUIRED");
    document.status = "EXTRACTING";
    return true as const;
  }

  completeProcessing(jobId: string) {
    const job = this.requireJob(jobId);
    job.status = "SUCCEEDED";
    const document = this.requireDocument(job.documentId);
    document.status = "EXTRACTED";
    return true as const;
  }

  enqueueProcessing(documentId: string, idempotencyKey: string) {
    this.requireDocument(documentId);
    const duplicateId = this.processingIdempotency.get(idempotencyKey);
    if (duplicateId) return { duplicate: true as const, job: this.processingJobs.get(duplicateId)! };
    const job: IsolatedProcessingJob = { id: id("proc", idempotencyKey), documentId, idempotencyKey, status: "QUEUED", attempts: 0, claimedBy: null };
    this.processingJobs.set(job.id, job);
    this.processingIdempotency.set(idempotencyKey, job.id);
    return { duplicate: false as const, job };
  }

  claimProcessingJob(jobId: string, workerId: string) {
    const job = this.requireJob(jobId);
    if (job.claimedBy && job.claimedBy !== workerId) throw new Error("ALREADY_CLAIMED");
    if (job.status === "SUCCEEDED" || job.status === "DEAD_LETTER") return false;
    job.claimedBy = workerId;
    job.status = "RUNNING";
    job.attempts += 1;
    return true;
  }

  completeExtraction(documentId: string, sourceId: string, text: string, extractor: string) {
    const document = this.requireDocument(documentId);
    if (text.length === 0) throw new Error("EMPTY_EXTRACTION");
    const source = { id: sourceId, documentId, text, extractor };
    this.extractionSources.set(sourceId, source);
    document.status = "EXTRACTED";
    document.revision += 1;
    this.record({ stage: "EXTRACTION_COMPLETED", entityId: sourceId, documentId, jobId: null, attemptId: null, status: "SUCCEEDED" });
    return source;
  }

  createFact(input: { documentId: string; sourceId: string; fieldPath: string; value: unknown; evidenceId: string; provenance: DocumentProvenance[]; critical?: boolean }) {
    this.requireDocument(input.documentId);
    if (!this.extractionSources.has(input.sourceId)) throw new Error("INVALID_FOREIGN_KEY");
    const fact: IsolatedFact = { id: id("fact", `${input.documentId}:${input.fieldPath}`), documentId: input.documentId, sourceId: input.sourceId, value: input.value, originalValue: input.value, critical: input.critical ?? true, hasEvidence: true, hasProvenance: input.provenance.length > 0, review: "UNREVIEWED", evidenceIds: [input.evidenceId], provenance: input.provenance, revision: 0 };
    this.facts.set(fact.id, fact);
    this.evidence.set(input.evidenceId, { id: input.evidenceId, factId: fact.id, excerpt: "Synthetic evidence excerpt", sourceUrl: null });
    return fact;
  }

  reviewFact(factId: string, action: "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE", reviewerId: string, reviewedValue?: unknown, reviewerNote?: string, expectedRevision?: number) {
    const fact = this.facts.get(factId);
    if (!fact) throw new Error("INVALID_FOREIGN_KEY");
    if (expectedRevision !== undefined && expectedRevision !== fact.revision) throw new Error("STALE_REVISION");
    const originalValue = fact.value;
    const nextReview = action === "ACCEPT" ? "ACCEPTED" : action === "EDIT" ? "EDITED" : action === "REJECT" ? "REJECTED" : "REQUEST_SOURCE";
    fact.value = action === "EDIT" ? reviewedValue : fact.value;
    fact.review = nextReview;
    fact.reviewedValue = fact.value;
    fact.reviewerId = reviewerId;
    fact.reviewedAt = nowIso();
    fact.reviewerNote = reviewerNote;
    fact.revision += 1;
    const decision = { id: id("fact-review", `${factId}:${fact.revision}`), factId, action, originalValue, reviewedValue: fact.value, reviewerId, reviewerNote: reviewerNote ?? null, revision: fact.revision };
    this.factReviews.push(decision);
    this.factReviewRevision.set(factId, fact.revision);
    this.record({ stage: "FACT_REVIEWED", entityId: factId, documentId: fact.documentId, jobId: null, attemptId: null, status: action });
    return decision;
  }

  createGenerationJob(documentId: string, idempotencyKey: string) {
    this.requireDocument(documentId);
    const duplicateId = this.generationIdempotency.get(idempotencyKey);
    if (duplicateId) return { duplicate: true as const, job: this.generationJobs.get(duplicateId)! };
    const job = { id: id("gen", idempotencyKey), documentId, idempotencyKey, status: "QUEUED" as const, attempts: 0, qualityGate: "PENDING" as const };
    this.generationJobs.set(job.id, job);
    this.generationIdempotency.set(idempotencyKey, job.id);
    this.record({ stage: "GENERATION_REQUESTED", entityId: job.id, documentId, jobId: job.id, attemptId: null, status: "QUEUED" });
    return { duplicate: false as const, job };
  }

  beginGeneration(jobId: string) {
    const job = this.generationJobs.get(jobId);
    if (!job) throw new Error("INVALID_FOREIGN_KEY");
    if (job.attempts >= AI_COST_CONTROL_POLICY.maxRetries) throw new Error("MAX_ATTEMPTS_EXHAUSTED");
    job.status = "RUNNING";
    job.attempts += 1;
    const attempt = { id: id("attempt", `${jobId}:${job.attempts}`), jobId, attempt: job.attempts, status: "RUNNING" };
    this.generationAttempts.set(attempt.id, attempt);
    return attempt;
  }

  completeGeneration(jobId: string, attemptId: string, claims: Array<Omit<IsolatedClaim, "jobId" | "documentId" | "revision">>, qualityGate: "PASS" | "PASS_WITH_REVIEW" = "PASS") {
    const job = this.generationJobs.get(jobId);
    if (!job) throw new Error("INVALID_FOREIGN_KEY");
    const attempt = this.generationAttempts.get(attemptId);
    if (!attempt || attempt.jobId !== jobId) throw new Error("INVALID_FOREIGN_KEY");
    job.status = "SUCCEEDED";
    job.qualityGate = qualityGate;
    const document = this.requireDocument(job.documentId);
    document.status = "DRAFT_READY";
    for (const claimInput of claims) this.claims.set(claimInput.id, { ...claimInput, jobId, documentId: job.documentId, revision: 0 });
    this.record({ stage: "GENERATION_COMPLETED", entityId: jobId, documentId: job.documentId, jobId, attemptId, status: "DRAFT" });
    return buildDraftIntegrity({ generationJobId: jobId, generationAttemptId: attemptId, sourceDocumentId: job.documentId, sourceLanguage: "ar", outputLanguage: "ARABIC", generationMode: "A3LAM_PERSON_DRAFT", createdAt: nowIso(), provenance: claims.flatMap((claim) => claim.provenance), claims: [...this.claims.values()].filter((claim) => claim.jobId === jobId), unresolvedConflicts: [], reviewState: "CLAIM_REVIEW_REQUIRED" });
  }

  reviewClaim(claimId: string, action: "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE", reviewerId: string, expectedRevision?: number) {
    const claim = this.claims.get(claimId);
    if (!claim) throw new Error("INVALID_FOREIGN_KEY");
    if (expectedRevision !== undefined && expectedRevision !== claim.revision) throw new Error("STALE_REVISION");
    claim.status = action === "ACCEPT" ? "ACCEPTED" : action === "EDIT" ? "EDITED" : action === "REJECT" ? "REJECTED" : "NEEDS_SOURCE";
    claim.reviewerId = reviewerId;
    claim.reviewedAt = nowIso();
    claim.revision += 1;
    const decision = { id: id("claim-review", `${claimId}:${claim.revision}`), claimId, action, reviewerId, revision: claim.revision };
    this.claimReviews.push(decision);
    this.claimReviewRevision.set(claimId, claim.revision);
    this.record({ stage: "CLAIM_REVIEWED", entityId: claimId, documentId: claim.documentId, jobId: claim.jobId, attemptId: null, status: action });
    return decision;
  }

  failJob(jobId: string, errorClass: string) {
    const job = this.processingJobs.get(jobId) ?? this.generationJobs.get(jobId);
    if (!job) throw new Error("INVALID_FOREIGN_KEY");
    if ("attempts" in job && job.attempts >= AI_QUEUE_DEFAULT_POLICY.maxRetries) {
      job.status = "DEAD_LETTER";
    } else {
      job.status = "FAILED";
    }
    this.record({ stage: "JOB_FAILED", entityId: jobId, documentId: "documentId" in job ? job.documentId : null, jobId, attemptId: null, status: job.status, errorClass });
    return job.status;
  }

  deleteDocument(documentId: string, owner: SandboxOwner) {
    const document = this.requireDocument(documentId);
    if (document.owner.ownerId !== owner.ownerId || document.owner.ownerType !== owner.ownerType) throw new Error("OWNER_MISMATCH");
    for (const job of [...this.processingJobs.values()]) if (job.documentId === documentId) this.processingJobs.delete(job.id);
    for (const source of [...this.extractionSources.values()]) if (source.documentId === documentId) { this.extractionSources.delete(source.id); for (const fact of [...this.facts.values()]) if (fact.sourceId === source.id) { this.facts.delete(fact.id); for (const evidence of [...this.evidence.values()]) if (evidence.factId === fact.id) this.evidence.delete(evidence.id); } }
    for (const job of [...this.generationJobs.values()]) if (job.documentId === documentId) { this.generationJobs.delete(job.id); for (const claim of [...this.claims.values()]) if (claim.jobId === job.id) this.claims.delete(claim.id); }
    this.storageKeys.delete(document.storageKey);
    document.status = "DELETED";
    this.record({ stage: "DOCUMENT_DELETED", entityId: documentId, documentId, jobId: null, attemptId: null, status: "DELETED" });
    return true as const;
  }

  counters(providerCalls = 0): IsolatedCounters {
    return { documents: this.documents.size, processingJobs: this.processingJobs.size, extractionJobs: this.extractionSources.size, generationJobs: this.generationJobs.size, generationAttempts: this.generationAttempts.size, claims: this.claims.size, reviewDecisions: this.factReviews.length + this.claimReviews.length, storageObjects: this.storageKeys.size, mockProviderCalls: providerCalls };
  }

  private requireDocument(idValue: string) { const document = this.documents.get(idValue); if (!document || document.status === "DELETED") throw new Error("INVALID_FOREIGN_KEY"); return document; }
  private requireJob(idValue: string) { const job = this.processingJobs.get(idValue); if (!job) throw new Error("INVALID_FOREIGN_KEY"); return job; }
  private record(input: Omit<IsolatedAudit, "id" | "durationMs" | "errorClass"> & { durationMs?: number | null; errorClass?: string | null }) { this.audits.push({ id: id("audit", `${input.stage}:${input.entityId}:${this.audits.length}`), durationMs: input.durationMs ?? 0, errorClass: input.errorClass ?? null, ...input }); }
}

export class IsolatedMockProvider {
  readonly id = "isolated-mock-provider";
  readonly modelId = "deterministic-test-model";
  readonly status = "READY" as const;
  calls = 0;
  readonly requests: AiGenerationRequest[] = [];

  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    this.calls += 1;
    this.requests.push(JSON.parse(JSON.stringify(buildProviderSafePayload({ normalizedSourceText: request.input.normalizedText, approvedFacts: request.input.facts.map((fact) => ({ fieldPath: fact.fieldPath, value: fact.value, evidenceIds: fact.evidenceIds })), selectedEvidenceIds: request.input.facts.flatMap((fact) => fact.evidenceIds), mode: request.mode, outputLanguage: request.outputLanguage }))));
    return { status: "SUCCEEDED", draftStatus: "DRAFT", mode: request.mode, outputLanguage: request.outputLanguage, providerId: this.id, modelId: this.modelId, claims: [], qualityGate: "PASS" };
  }
}

export class IsolatedRateLimiter {
  private readonly counts = new Map<string, number>();
  constructor(private readonly limit = 2) {}
  consume(scope: "user" | "ip" | "document" | "generation-job", key: string) { const counterKey = `${scope}:${key}`; const used = this.counts.get(counterKey) ?? 0; if (used >= this.limit) throw new Error("RATE_LIMITED"); this.counts.set(counterKey, used + 1); return { used: used + 1, limit: this.limit } as const; }
  retryAfter(scope: "user" | "ip" | "document" | "generation-job", key: string) { this.counts.delete(`${scope}:${key}`); return this.consume(scope, key); }
}

export class IsolatedCostGuard {
  assertDocumentSize(bytes: number) { if (bytes > AI_RATE_LIMIT_POLICY.maxInputBytes) throw new Error("DOCUMENT_TOO_LARGE"); return true as const; }
  assertExtractedText(characters: number) { if (characters > AI_COST_CONTROL_POLICY.maxInputCharacters) throw new Error("EXTRACTED_TEXT_TOO_LARGE"); return true as const; }
  assertOutputTokens(tokens: number) { if (tokens > AI_COST_CONTROL_POLICY.maxOutputTokens) throw new Error("OUTPUT_TOO_LARGE"); return true as const; }
  assertAttempts(attempt: number) { if (attempt > AI_COST_CONTROL_POLICY.maxRetries) throw new Error("MAX_ATTEMPTS_EXHAUSTED"); return true as const; }
}

export function assertRedactedAuditEvents(events: IsolatedAudit[]) {
  const serialized = JSON.stringify(events);
  for (const forbidden of ["raw CV", "raw extracted text", "prompt", "provider response", "DATABASE_URL", "authorization", "password", "session token", "storage secret"]) if (serialized.includes(forbidden)) throw new Error(`AUDIT_REDACTION_FAILED:${forbidden}`);
  return true as const;
}

export function assertNoPublicAiProjection(html: string) {
  for (const forbidden of ["ai_documents", "raw extracted text", "provider payload", "storageKey", "private metadata", "AI prompt"]) if (html.includes(forbidden)) throw new Error(`PUBLIC_FIREWALL_FAILED:${forbidden}`);
  return true as const;
}

export function assertNoProductionImports(source: string) {
  if (/from ["'](?:@\/)?(?:\.\.\/)*lib\/ai\//.test(source) || source.includes("/api/admin/ai/")) throw new Error("PUBLIC_AI_IMPORT_FOUND");
  return true as const;
}

export type IsolatedSupportAdapters = {
  storage: SandboxPrivateStorage;
  retention: SandboxRetentionController;
  telemetry: SandboxTelemetry;
};
