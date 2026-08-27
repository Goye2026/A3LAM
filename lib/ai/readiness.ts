import { getMigrationPreflight } from "@/lib/admin/migrationRegistry";
import { getAiFeatureGates } from "./activation";
import { getAiProviderReadiness } from "./provider";
import { getAiQueueReadiness } from "./queue";
import { getDocumentStorageReadiness } from "./storage";
import { getAiMalwareScannerState } from "./malware";
import { getAiOcrStatus } from "./ocr";
import { getAiOperationsReadiness } from "./operations";
import { getAiRetentionReadiness } from "./retention";
import { getAiWorkspaceSnapshot } from "./workspace";
import { getAvailableDocumentExtractors } from "./ingestion";
import type { AiReadinessItem, AiReadinessKey, AiReadinessLayer, AiReadinessReport, AiReadinessStatus, AiRiskLevel, AiWorkspaceSnapshot } from "./types";

const readinessLayers: Record<AiReadinessKey, AiReadinessLayer> = {
  authentication: "SECURITY",
  rbac: "SECURITY",
  csrf: "SECURITY",
  documentIngestion: "CODE",
  privateStorage: "INFRASTRUCTURE",
  malwareScanner: "INFRASTRUCTURE",
  extraction: "CODE",
  ocr: "INFRASTRUCTURE",
  queue: "INFRASTRUCTURE",
  worker: "INFRASTRUCTURE",
  aiProvider: "INFRASTRUCTURE",
  promptBoundary: "SECURITY",
  generation: "CODE",
  claimsProvenance: "EDITORIAL",
  humanReview: "EDITORIAL",
  workflowStateMachine: "CODE",
  publicationGuard: "SECURITY",
  persistence: "DATA",
  migrations: "DATA",
  retention: "OPERATIONAL",
  rateLimits: "OPERATIONAL",
  costControls: "OPERATIONAL",
  observability: "OPERATIONAL",
  audit: "SECURITY",
  rollback: "OPERATIONAL",
  privacy: "SECURITY",
  externalQa: "OPERATIONAL",
  publication: "EDITORIAL",
};

const readinessRisks: Record<AiReadinessKey, AiRiskLevel> = {
  authentication: "P0",
  rbac: "P0",
  csrf: "P0",
  documentIngestion: "P1",
  privateStorage: "P0",
  malwareScanner: "P0",
  extraction: "P1",
  ocr: "P1",
  queue: "P1",
  worker: "P1",
  aiProvider: "P1",
  promptBoundary: "P0",
  generation: "P1",
  claimsProvenance: "P0",
  humanReview: "P0",
  workflowStateMachine: "P0",
  publicationGuard: "P0",
  persistence: "P1",
  migrations: "P1",
  retention: "P1",
  rateLimits: "P1",
  costControls: "P1",
  observability: "P2",
  audit: "P1",
  rollback: "P1",
  privacy: "P0",
  externalQa: "P2",
  publication: "P0",
};

function item(
  key: AiReadinessItem["key"],
  domain: AiReadinessItem["domain"],
  status: AiReadinessStatus,
  reason: string,
  evidence: string[],
  nextStep: string,
  blocker = status === "BLOCKED" || status === "REQUIRES_CONFIGURATION" || status === "NOT_TESTED",
  owner = "A3LAM AI Platform / Editorial Operations",
  verificationMethod = "Read-only code/configuration review plus isolated acceptance test",
): AiReadinessItem {
  return { key, domain, layer: readinessLayers[key], riskLevel: readinessRisks[key], status, reason, evidence, nextStep, owner, verificationMethod, blocker };
}

function migrationSummary(preflight: Awaited<ReturnType<typeof getMigrationPreflight>>): AiReadinessReport["migration"] {
  const snapshot = preflight.registrySnapshot;
  const hasVerifiedRegistry = preflight.database === "available" && snapshot.status !== "unavailable";
  return {
    status: snapshot.status,
    appliedCount: hasVerifiedRegistry ? snapshot.appliedCount : null,
    pendingCount: hasVerifiedRegistry ? snapshot.pendingCount : null,
    expectedCount: hasVerifiedRegistry ? snapshot.expectedCount : null,
    nextMigration: preflight.nextMigration,
  };
}

function buildItems(snapshot: AiWorkspaceSnapshot, migration: Awaited<ReturnType<typeof getMigrationPreflight>>): AiReadinessItem[] {
  const provider = getAiProviderReadiness();
  const providerState = provider.configured ? "CONFIGURED" : provider.status === "ERROR" ? "INVALID_CONFIGURATION" : "REQUIRES_CONFIGURATION";
  const generationProvider = provider.status;
  const storage = getDocumentStorageReadiness();
  const storageState = storage.state;
  const queue = getAiQueueReadiness();
  const queueState = queue.state;
  const malwareState = getAiMalwareScannerState();
  const ocrStatus = getAiOcrStatus();
  const operations = getAiOperationsReadiness();
  const retention = getAiRetentionReadiness();
  const extractors = getAvailableDocumentExtractors();
  const migrationStatus = migration.registrySnapshot.status;
  const providerStatus: AiReadinessStatus = providerState === "INVALID_CONFIGURATION" ? "BLOCKED" : providerState === "CONFIGURED" && generationProvider === "READY" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION";

  return [
    item("authentication", "SECURITY", "READY", "Admin authentication and protected route checks are implemented server-side.", ["Admin AI page performs server-side access gating.", "Anonymous production smoke returned a redirect for /admin and /admin/ai."], "Keep authentication session and dependency-failure behavior under external security review."),
    item("rbac", "SECURITY", "READY", "Existing Admin RBAC preserves least privilege for AI operations.", ["SUPER_ADMIN/ADMIN generation policy, EDITOR review/read policy, and no MODERATOR AI scope are covered by inherited tests.", "Mutation routes retain server-side permission checks."], "Review role overrides before any future activation."),
    item("csrf", "SECURITY", "READY", "Mutation routes retain same-origin protection and do not rely on client-side checks.", ["Inherited tests cover same-origin, cross-origin, malformed, missing, null, protocol, host, and port cases.", "AI mutation routes include the server-side same-origin helper."], "Repeat same-origin verification in the approved deployment environment before activation."),
    item("documentIngestion", "APPLICATION", extractors.length > 0 ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", extractors.length > 0 ? "Bounded TXT/PDF/DOCX ingestion exists for local deterministic testing only." : "No ingestion extractor is available.", [`available local extractors: ${extractors.join(", ") || "none"}`, "No Production upload or ingestion was executed."], "Keep ingestion behind private storage, scanning, queue, and explicit gates.", true),
    item("privateStorage", "INFRASTRUCTURE", storageState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", storageState === "AVAILABLE" ? "Storage contract is private-by-default, but Production activation still requires an isolated storage review." : "Private storage is not configured.", [`storage state: ${storageState}`, `signed retrieval: ${storage.signedRetrieval}`, `public indexable: ${storage.publicIndexable}`, "No Production bucket was created."], "Provision and security-review private storage before activation."),
    item("malwareScanner", "INFRASTRUCTURE", malwareState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", "Malware scanning is required before processing and no Production scanner is configured.", [`scanner state: ${malwareState}`, "Synthetic tests block infected, unavailable, timeout, and error outcomes."], "Provision and independently verify a scanner adapter."),
    item("extraction", "APPLICATION", extractors.length > 0 ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", extractors.length > 0 ? "Local TXT/PDF/DOCX extraction is available with bounded parsers." : "No extraction adapter is available.", [`available local extractors: ${extractors.join(", ") || "none"}`, "OCR-required documents remain blocked when OCR is unavailable."], "Keep extraction behind private storage, malware scan, queue, and processing gates.", true),
    item("ocr", "INFRASTRUCTURE", "DISABLED", "OCR is explicitly disabled and no OCR provider is configured.", [`OCR status: ${ocrStatus}`, "AI_OCR_ENABLED=false.", "Scanned documents are not silently processed."], "Configure OCR separately only after an isolated provider and cost review.", false),
    item("queue", "INFRASTRUCTURE", queueState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", queueState === "AVAILABLE" ? "Queue contract exists, but Production durable queue activation is not proven." : "Processing queue is not configured.", [`queue state: ${queueState}`, "No Production queue was provisioned.", "Heavy processing remains outside HTTP by contract."], "Provision a durable queue and verify duplicate, retry, stale-job, and cancellation behavior."),
    item("worker", "INFRASTRUCTURE", "REQUIRES_CONFIGURATION", "No Production worker runtime is configured or verified.", ["Worker readiness is not inferred from queue configuration.", "No background job ran in Production."], "Provision and independently verify worker lease, timeout, retry, and shutdown behavior."),
    item("aiProvider", "INFRASTRUCTURE", providerStatus, providerStatus === "BLOCKED" ? "Provider configuration is invalid." : "No executable Production provider is configured; network calls remain disabled by policy.", provider.evidence, "Configure and independently approve provider sandbox, model allowlist, timeout, retry, and cost policy."),
    item("promptBoundary", "SECURITY", "READY_WITH_LIMITATIONS", "Prompt construction separates fixed instructions from untrusted document data; no real provider call was executed.", ["Prompt builder marks instruction-like text as untrusted data.", "Validation rejects secret-like and unsafe output.", "Inherited prompt-injection tests pass."], "Repeat boundary testing with the approved provider in an isolated environment.", true),
    item("generation", "APPLICATION", "DISABLED", "Production generation is explicitly OFF even if a provider is later configured.", ["AI_GENERATION_ENABLED=false.", "AI_PRODUCTION_ENABLED=false.", "Generation routes reject before job creation."], "Enable only through a separate authorized change after all mandatory dependencies are proven.", true),
    item("claimsProvenance", "APPLICATION", "READY_WITH_LIMITATIONS", "Claims retain evidence, provenance, source facts, review state, and reviewer metadata in the tested contracts.", ["Fact and claim review matrices are covered in isolated tests.", "Canonical types require evidence/provenance fields.", "No AI claim becomes trusted without review."], "Verify persisted claim/evidence integrity in an isolated DB before activation.", true),
    item("humanReview", "APPLICATION", snapshot.persistence === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", "Human review contracts and UI exist, but persistence-backed review depends on AI migrations.", ["Fact and claim actions are explicit and bounded.", "AI output remains DRAFT and no auto-publication path exists."], "Verify persisted review and audit behavior in an isolated database."),
    item("workflowStateMachine", "APPLICATION", "READY", "The canonical workflow state machine enforces ordered transitions, revisions, evidence, claims, and DRAFT-only output.", ["workflowIntegrity is the single central state machine.", "Full synthetic progression reaches EDITORIAL_DRAFT_READY while preserving DRAFT.", "Invalid transitions return deterministic failure codes."], "Keep workflow transitions server-side and require separate publication approval."),
    item("publicationGuard", "SECURITY", "READY", "AI output is DRAFT-only and there is no automatic Person/Profile or public publication path.", ["Generation result requires draftStatus=DRAFT.", "Public route/source projection checks pass.", "Publication gate is hard-false."], "Retain the firewall and require explicit editorial publication workflow for any future change.", false),
    item("persistence", "APPLICATION", snapshot.persistence === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : snapshot.persistence === "REQUIRES_MIGRATION" ? "REQUIRES_CONFIGURATION" : "NOT_TESTED", snapshot.persistence === "AVAILABLE" ? "AI persistence is available, but activation gates remain OFF." : snapshot.persistence === "REQUIRES_MIGRATION" ? "AI persistence migrations are not applied." : "AI persistence could not be verified in the current environment.", [`persistence state: ${snapshot.persistence}`, "No Production DDL/DML was executed."], "Verify persistence only through a separately proven isolated database."),
    item("migrations", "APPLICATION", migrationStatus === "inconsistent" ? "BLOCKED" : migrationStatus === "healthy" ? "READY" : "REQUIRES_CONFIGURATION", migrationStatus === "healthy" ? "Repository and registry order are consistent." : migrationStatus === "inconsistent" ? "Migration registry or ordering is inconsistent." : "Migration registry is pending or unavailable.", [`registry status: ${migrationStatus}`, migration.nextMigration ? `next migration: ${migration.nextMigration}` : "next migration: not verified", "Migration execution was not attempted."], "Resolve migration readiness in an isolated environment; do not run Production migrations in this phase."),
    item("retention", "OPERATIONS", retention.status === "REQUIRES_CONFIGURATION" ? "REQUIRES_CONFIGURATION" : "READY_WITH_LIMITATIONS", "Retention and deletion executor are not configured; automatic deletion is disabled.", [`retention status: ${retention.status}`, `automatic deletion enabled: ${retention.policy.automaticDeletionEnabled}`, "No Production deletion or cleanup ran."], "Define and review retention, cascade, orphan cleanup, and deletion policies."),
    item("rateLimits", "OPERATIONS", "READY_WITH_LIMITATIONS", "Static bounded payload and extraction limits exist; distributed Production enforcement is not configured.", [`distributed enforcement: ${operations.rateLimits.distributedEnforcement}`, `max concurrent jobs: ${operations.rateLimits.maxConcurrentJobs}`, "No Production traffic limit was measured."], "Configure distributed upload, extraction, generation, retry, review, and concurrency limits.", true),
    item("costControls", "OPERATIONS", "REQUIRES_CONFIGURATION", "Provider pricing and per-user/per-job budgets are not configured.", [`pricing source: ${operations.costControls.pricingSource}`, `circuit breaker: ${operations.costControls.globalCircuitBreaker}`, "No provider calls or billable inference occurred."], "Configure model allowlist, pricing, caps, budgets, circuit breaker, and alerts."),
    item("observability", "OPERATIONS", "READY_WITH_LIMITATIONS", "Content-safe event fields are defined, but Production metrics/traces are not configured.", [`allowed telemetry: ${operations.observability.allowedFields.join(", ")}`, `raw content logging: ${operations.observability.rawContentLogging}`, "Production metrics/traces are not configured."], "Connect privacy-safe logs, metrics, traces, retention, and alerts.", true),
    item("audit", "SECURITY", "READY_WITH_LIMITATIONS", "Audit taxonomy and mapping exist; persistent audit verification depends on an available isolated database.", ["AI audit actions cover document, extraction, generation, review, draft, and publication decisions.", "Synthetic audit output excludes raw content and credentials."], "Verify audit writes and access/retention controls in an isolated environment.", true),
    item("rollback", "OPERATIONS", "READY_WITH_LIMITATIONS", "Application rollback is available through hard-false gates and normal deployment rollback; destructive DB rollback is not used.", ["All Production AI gates remain OFF.", "No migration or Production DDL/DML was executed.", "Git history uses normal commits without rewrite."], "Document and rehearse provider, queue, storage, and DB rollback before activation.", true),
    item("privacy", "SECURITY", "READY_WITH_LIMITATIONS", "Public AI isolation and private-by-default contracts are present; real private storage is not provisioned.", ["Public routes, search, sitemap, OG, and JSON-LD do not project AI documents.", "Production response privacy scan passed on inspected routes."], "Complete security review of storage, signed retrieval, access logs, deletion, and public projections.", true),
    item("externalQa", "OPERATIONS", "NOT_TESTED", "External browser, screen-reader, measured contrast, and cross-browser QA evidence is not available in this phase.", ["No external browser QA result is inferred from local tests.", "No measured WCAG 2.2 AA or screen-reader claim is made."], "Obtain genuine Chromium/Firefox/WebKit, viewport, screen-reader, contrast, and typography evidence before any activation decision."),
    item("publication", "APPLICATION", "DISABLED", "Publication remains a hard safety boundary and is not part of this phase.", ["AI_PUBLICATION_ENABLED=false.", "Automatic Person/Profile creation is disabled.", "No publication mutation exists in this phase."], "Keep disabled until a separately approved editorial publication workflow exists.", false),
  ];
}

function summarizeLayer(items: AiReadinessItem[], layer: AiReadinessLayer): AiReadinessStatus {
  const statuses = items.filter((entry) => entry.layer === layer).map((entry) => entry.status);
  if (statuses.includes("BLOCKED")) return "BLOCKED";
  if (statuses.includes("REQUIRES_CONFIGURATION")) return "REQUIRES_CONFIGURATION";
  if (statuses.includes("NOT_TESTED")) return "NOT_TESTED";
  if (statuses.includes("DISABLED")) return "DISABLED";
  if (statuses.includes("READY_WITH_LIMITATIONS")) return "READY_WITH_LIMITATIONS";
  return "READY";
}

export function evaluateAiActivationGate(items: AiReadinessItem[]): AiReadinessReport["activation"] {
  const blockers = items.filter((entry) => entry.blocker).map((entry) => entry.key);
  const layers = {
    CODE: summarizeLayer(items, "CODE"),
    INFRASTRUCTURE: summarizeLayer(items, "INFRASTRUCTURE"),
    DATA: summarizeLayer(items, "DATA"),
    OPERATIONAL: summarizeLayer(items, "OPERATIONAL"),
    EDITORIAL: summarizeLayer(items, "EDITORIAL"),
    SECURITY: summarizeLayer(items, "SECURITY"),
  } satisfies Record<AiReadinessLayer, AiReadinessStatus>;
  return { decision: blockers.length > 0 ? "BLOCKED" : "NOT_READY", canActivate: false, blockers, layers };
}

export async function getAiProductionReadinessReport(): Promise<AiReadinessReport> {
  const [snapshot, migration] = await Promise.all([getAiWorkspaceSnapshot(), getMigrationPreflight()]);
  const gates = getAiFeatureGates();
  const items = buildItems(snapshot, migration);
  const activation = evaluateAiActivationGate(items);
  return {
    generatedAt: new Date().toISOString(),
    overall: activation.decision,
    activation,
    gates,
    items,
    migration: migrationSummary(migration),
  };
}
