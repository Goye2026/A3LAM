import type { AiGenerationLanguage, AiGenerationMode, AiQualityGateStatus, DocumentProvenance } from "./types";

export const AI_EDITORIAL_WORKFLOW_STATES = [
  "EMPTY",
  "DOCUMENT_READY",
  "EXTRACTED",
  "FACTS_READY",
  "FACT_REVIEW_REQUIRED",
  "FACTS_ACCEPTED",
  "GENERATION_READY",
  "GENERATING",
  "DRAFT_READY",
  "CLAIM_REVIEW_REQUIRED",
  "DRAFT_REVIEWED",
  "EDITORIAL_DRAFT_READY",
] as const;

export type AiEditorialWorkflowState = (typeof AI_EDITORIAL_WORKFLOW_STATES)[number];
export type WorkflowFactReviewDecision = "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED" | "REQUEST_SOURCE";
export type WorkflowClaimReviewStatus = "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED" | "NEEDS_SOURCE" | "CONFLICT";
export type WorkflowFailureCode =
  | "INVALID_TRANSITION"
  | "PERMISSION_DENIED"
  | "REVIEW_REQUIRED"
  | "SOURCE_REQUIRED"
  | "CONFLICT_UNRESOLVED"
  | "GENERATION_NOT_READY"
  | "OUTPUT_INVALID"
  | "CLAIM_REVIEW_REQUIRED"
  | "QUALITY_GATE_FAILED"
  | "WORKSPACE_NOT_FOUND"
  | "STALE_REVISION";

export type WorkflowActor = {
  id: string;
  authenticated: boolean;
  permission: string;
};

export type WorkflowFact = {
  id: string;
  critical: boolean;
  hasEvidence: boolean;
  hasProvenance: boolean;
  review: WorkflowFactReviewDecision;
  originalValue: unknown;
  reviewedValue?: unknown;
  reviewerId?: string;
  reviewedAt?: string;
  reviewerNote?: string;
};

export type WorkflowClaim = {
  id: string;
  critical: boolean;
  sourceFactIds: string[];
  evidenceIds: string[];
  provenance: DocumentProvenance[];
  status: WorkflowClaimReviewStatus;
  reviewerId?: string;
  reviewedAt?: string;
  reviewerNote?: string;
};

export type WorkflowDraftIntegrity = {
  generationJobId: string;
  generationAttemptId: string;
  sourceDocumentId: string;
  sourceLanguage: string;
  outputLanguage: AiGenerationLanguage;
  generationMode: AiGenerationMode;
  createdAt: string;
  provenance: DocumentProvenance[];
  claims: WorkflowClaim[];
  unresolvedConflicts: string[];
  reviewState: "CLAIM_REVIEW_REQUIRED" | "DRAFT_REVIEWED" | "EDITORIAL_DRAFT_READY";
  revision: number;
};

export type WorkflowSnapshot = {
  workspaceId: string;
  state: AiEditorialWorkflowState;
  revision: number;
  document: { id: string | null; valid: boolean };
  extraction: { status: "NOT_STARTED" | "SUCCEEDED" | "FAILED"; candidateFactCount: number };
  facts: WorkflowFact[];
  generation: {
    mode: AiGenerationMode | null;
    outputLanguage: AiGenerationLanguage | null;
    jobId: string | null;
    attemptId: string | null;
    jobValid: boolean;
    outputValid: boolean;
    draftStatus: "NONE" | "DRAFT";
  };
  claims: WorkflowClaim[];
  unresolvedConflicts: string[];
  qualityGate: AiQualityGateStatus | null;
  draft: WorkflowDraftIntegrity | null;
};

export type WorkflowTransitionContext = {
  actor: WorkflowActor;
  expectedRevision?: number;
  hasRequiredEvidence?: boolean;
  generationJobValid?: boolean;
  outputValidationPassed?: boolean;
};

export type WorkflowTransitionResult =
  | { ok: true; snapshot: WorkflowSnapshot }
  | { ok: false; code: WorkflowFailureCode; message: string; blockingFields: string[] };

const transitionGraph: Record<AiEditorialWorkflowState, readonly AiEditorialWorkflowState[]> = {
  EMPTY: ["DOCUMENT_READY"],
  DOCUMENT_READY: ["EXTRACTED"],
  EXTRACTED: ["FACTS_READY"],
  FACTS_READY: ["FACT_REVIEW_REQUIRED"],
  FACT_REVIEW_REQUIRED: ["FACTS_ACCEPTED"],
  FACTS_ACCEPTED: ["GENERATION_READY"],
  GENERATION_READY: ["GENERATING"],
  GENERATING: ["DRAFT_READY"],
  DRAFT_READY: ["CLAIM_REVIEW_REQUIRED"],
  CLAIM_REVIEW_REQUIRED: ["DRAFT_REVIEWED"],
  DRAFT_REVIEWED: ["EDITORIAL_DRAFT_READY"],
  EDITORIAL_DRAFT_READY: [],
};

export function createEmptyWorkflowSnapshot(workspaceId = "local-workspace"): WorkflowSnapshot {
  return {
    workspaceId,
    state: "EMPTY",
    revision: 0,
    document: { id: null, valid: false },
    extraction: { status: "NOT_STARTED", candidateFactCount: 0 },
    facts: [],
    generation: { mode: null, outputLanguage: null, jobId: null, attemptId: null, jobValid: false, outputValid: false, draftStatus: "NONE" },
    claims: [],
    unresolvedConflicts: [],
    qualityGate: null,
    draft: null,
  };
}

export function getAllowedWorkflowStates(current: AiEditorialWorkflowState): readonly AiEditorialWorkflowState[] {
  return transitionGraph[current];
}

export function assertExpectedRevision(currentRevision: number, expectedRevision: number | undefined): WorkflowTransitionResult | null {
  if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
    return { ok: false, code: "STALE_REVISION", message: "The workspace changed since it was loaded.", blockingFields: ["revision"] };
  }
  return null;
}

function failure(code: WorkflowFailureCode, message: string, blockingFields: string[]): WorkflowTransitionResult {
  return { ok: false, code, message, blockingFields };
}

function allCriticalFactsReviewed(facts: WorkflowFact[]) {
  return facts.filter((fact) => fact.critical).every((fact) => fact.review === "ACCEPTED" || fact.review === "EDITED");
}

function allClaimsReviewed(claims: WorkflowClaim[]) {
  return claims.filter((claim) => claim.critical).every((claim) => claim.status === "ACCEPTED" || claim.status === "EDITED" || claim.status === "REJECTED");
}

export function transitionWorkflow(snapshot: WorkflowSnapshot, requestedState: AiEditorialWorkflowState, context: WorkflowTransitionContext): WorkflowTransitionResult {
  if (!context.actor.authenticated || context.actor.permission !== "ai.workflow.write") return failure("PERMISSION_DENIED", "This workflow action requires the server-side AI workflow permission.", ["actor.permission"]);
  const stale = assertExpectedRevision(snapshot.revision, context.expectedRevision);
  if (stale) return stale;
  if (!transitionGraph[snapshot.state].includes(requestedState)) return failure("INVALID_TRANSITION", "The requested workflow transition is not allowed.", ["state"]);
  if (requestedState === "DOCUMENT_READY" && (!snapshot.document.id || !snapshot.document.valid)) return failure("WORKSPACE_NOT_FOUND", "A valid document is required before continuing.", ["document"]);
  if (requestedState === "EXTRACTED" && (snapshot.extraction.status !== "SUCCEEDED")) return failure("INVALID_TRANSITION", "Extraction must succeed before the workspace can continue.", ["extraction.status"]);
  if (requestedState === "FACTS_READY" && snapshot.extraction.candidateFactCount < 1) return failure("SOURCE_REQUIRED", "At least one candidate fact is required.", ["extraction.candidateFactCount"]);
  if (requestedState === "FACT_REVIEW_REQUIRED" && snapshot.facts.length < 1) return failure("REVIEW_REQUIRED", "Candidate facts must exist before review.", ["facts"]);
  if (requestedState === "FACTS_ACCEPTED") {
    if (snapshot.facts.some((fact) => fact.review === "REQUEST_SOURCE" || !fact.hasEvidence || !fact.hasProvenance)) return failure("SOURCE_REQUIRED", "Every accepted fact needs evidence and provenance.", ["facts.evidence", "facts.provenance"]);
    if (!allCriticalFactsReviewed(snapshot.facts)) return failure("REVIEW_REQUIRED", "Every critical fact requires human review.", ["facts.review"]);
    if (snapshot.unresolvedConflicts.length > 0) return failure("CONFLICT_UNRESOLVED", "Critical source conflicts must be resolved first.", ["unresolvedConflicts"]);
  }
  if (requestedState === "GENERATION_READY") {
    if (!allCriticalFactsReviewed(snapshot.facts)) return failure("REVIEW_REQUIRED", "Fact review is incomplete.", ["facts.review"]);
    if (snapshot.unresolvedConflicts.length > 0) return failure("CONFLICT_UNRESOLVED", "Generation cannot start with unresolved conflicts.", ["unresolvedConflicts"]);
    if (!snapshot.generation.mode || !snapshot.generation.outputLanguage) return failure("GENERATION_NOT_READY", "Generation mode and output language are required.", ["generation.mode", "generation.outputLanguage"]);
    if (context.hasRequiredEvidence === false) return failure("SOURCE_REQUIRED", "Generation requires source-backed evidence.", ["evidence"]);
  }
  if (requestedState === "GENERATING" && !(context.generationJobValid ?? snapshot.generation.jobValid)) return failure("GENERATION_NOT_READY", "A valid idempotent generation job is required.", ["generation.jobId"]);
  if (requestedState === "DRAFT_READY") {
    if (!(context.outputValidationPassed ?? snapshot.generation.outputValid)) return failure("OUTPUT_INVALID", "Validated DRAFT output is required.", ["generation.outputValid"]);
    if (snapshot.generation.draftStatus !== "DRAFT") return failure("OUTPUT_INVALID", "Only DRAFT output is accepted by this workflow.", ["generation.draftStatus"]);
    if (snapshot.claims.length < 1) return failure("OUTPUT_INVALID", "A valid generated output must retain at least one claim.", ["claims"]);
  }
  if (requestedState === "DRAFT_REVIEWED") {
    if (!allClaimsReviewed(snapshot.claims)) return failure("CLAIM_REVIEW_REQUIRED", "Every critical claim requires human review.", ["claims.status"]);
    if (snapshot.claims.some((claim) => claim.status === "NEEDS_SOURCE" || claim.status === "CONFLICT")) return failure("CLAIM_REVIEW_REQUIRED", "Claims needing a source or conflict resolution cannot pass review.", ["claims.status"]);
  }
  if (requestedState === "EDITORIAL_DRAFT_READY") {
    if (snapshot.qualityGate !== "PASS" && snapshot.qualityGate !== "PASS_WITH_REVIEW") return failure("QUALITY_GATE_FAILED", "The deterministic quality gate has not passed.", ["qualityGate"]);
    if (snapshot.unresolvedConflicts.length > 0) return failure("CONFLICT_UNRESOLVED", "Editorial draft readiness requires no unresolved critical conflicts.", ["unresolvedConflicts"]);
    if (snapshot.generation.draftStatus !== "DRAFT") return failure("OUTPUT_INVALID", "Editorial readiness cannot change the DRAFT-only boundary.", ["generation.draftStatus"]);
  }
  return { ok: true, snapshot: { ...snapshot, state: requestedState, revision: snapshot.revision + 1 } };
}

export function buildDraftIntegrity(input: Omit<WorkflowDraftIntegrity, "reviewState" | "revision"> & { reviewState?: WorkflowDraftIntegrity["reviewState"]; revision?: number }): WorkflowDraftIntegrity {
  return {
    ...input,
    reviewState: input.reviewState ?? "CLAIM_REVIEW_REQUIRED",
    revision: input.revision ?? 0,
  };
}

export type QualityGateInput = {
  validDocument: boolean;
  extractionSucceeded: boolean;
  facts: WorkflowFact[];
  claims: WorkflowClaim[];
  sourceCoverage: number;
  outputValid: boolean;
  forbiddenContent: boolean;
  unsafeUrls: boolean;
  secretLikeOutput: boolean;
  draftStatus: "NONE" | "DRAFT";
  unresolvedConflicts: string[];
};

export function evaluateWorkflowQualityGate(input: QualityGateInput): { status: "PASS" | "PASS_WITH_LIMITATIONS" | "BLOCKED"; reasonCodes: string[]; blockingFields: string[] } {
  const reasonCodes: string[] = [];
  const blockingFields: string[] = [];
  if (!input.validDocument) { reasonCodes.push("DOCUMENT_INVALID"); blockingFields.push("validDocument"); }
  if (!input.extractionSucceeded) { reasonCodes.push("EXTRACTION_FAILED"); blockingFields.push("extractionSucceeded"); }
  if (input.facts.some((fact) => fact.critical && (fact.review === "UNREVIEWED" || fact.review === "REQUEST_SOURCE"))) { reasonCodes.push("FACT_REVIEW_REQUIRED"); blockingFields.push("facts.review"); }
  if (input.claims.some((claim) => claim.critical && (claim.status === "UNREVIEWED" || claim.status === "NEEDS_SOURCE" || claim.status === "CONFLICT"))) { reasonCodes.push("CLAIM_REVIEW_REQUIRED"); blockingFields.push("claims.status"); }
  if (input.unresolvedConflicts.length > 0) { reasonCodes.push("CONFLICT_UNRESOLVED"); blockingFields.push("unresolvedConflicts"); }
  if (!input.outputValid) { reasonCodes.push("OUTPUT_INVALID"); blockingFields.push("outputValid"); }
  if (input.forbiddenContent) { reasonCodes.push("FORBIDDEN_CONTENT"); blockingFields.push("forbiddenContent"); }
  if (input.unsafeUrls) { reasonCodes.push("UNSAFE_URL"); blockingFields.push("unsafeUrls"); }
  if (input.secretLikeOutput) { reasonCodes.push("SECRET_LIKE_OUTPUT"); blockingFields.push("secretLikeOutput"); }
  if (input.draftStatus !== "DRAFT") { reasonCodes.push("PUBLICATION_STATE"); blockingFields.push("draftStatus"); }
  if (input.claims.length < 1) { reasonCodes.push("CLAIMS_MISSING"); blockingFields.push("claims"); }
  if (reasonCodes.length > 0) return { status: "BLOCKED", reasonCodes, blockingFields };
  if (input.sourceCoverage < 1) return { status: "PASS_WITH_LIMITATIONS", reasonCodes: ["SOURCE_COVERAGE_LIMITED"], blockingFields: [] };
  return { status: "PASS", reasonCodes: [], blockingFields: [] };
}

export const AI_WORKFLOW_PUBLICATION_STATES = ["PUBLISHED", "PERSON_CREATED", "PROFILE_CREATED"] as const;

export function isPublicationState(state: string): boolean {
  return (AI_WORKFLOW_PUBLICATION_STATES as readonly string[]).includes(state);
}
