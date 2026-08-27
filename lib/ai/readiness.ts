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
import type { AiReadinessItem, AiReadinessReport, AiReadinessStatus, AiWorkspaceSnapshot } from "./types";

function item(
  key: AiReadinessItem["key"],
  domain: AiReadinessItem["domain"],
  status: AiReadinessStatus,
  reason: string,
  evidence: string[],
  nextStep: string,
  blocker = status === "BLOCKED" || status === "REQUIRES_CONFIGURATION",
  owner = "A3LAM AI Platform / Editorial Operations",
  verificationMethod = "Read-only code/configuration review plus isolated acceptance test",
): AiReadinessItem {
  return { key, domain, status, reason, evidence, nextStep, owner, verificationMethod, blocker };
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
    item("aiProvider", "INFRASTRUCTURE", providerStatus, providerStatus === "BLOCKED" ? "Provider configuration is invalid." : "No executable Production provider is configured; network calls remain disabled by policy.", provider.evidence, "Configure and independently approve a provider sandbox, model, timeout, retry, and cost policy."),
    item("privateStorage", "INFRASTRUCTURE", storageState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", storageState === "AVAILABLE" ? "A storage adapter is available, but Production activation still requires a private-only review." : "Private storage is not configured.", [`storage state: ${storageState}`, `signed retrieval: ${storage.signedRetrieval}`, `public indexable: ${storage.publicIndexable}`, "No Production bucket was created."], "Provision and security-review private storage with signed retrieval and retention controls."),
    item("malwareScanner", "INFRASTRUCTURE", malwareState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", "Malware scanning is required before processing and no Production scanner is configured.", [`scanner state: ${malwareState}`, "No file was scanned in Production."], "Provision a scanner adapter and block processing on unavailable, timeout, error, or infected results."),
    item("queue", "INFRASTRUCTURE", queueState === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", queueState === "AVAILABLE" ? "A queue adapter is available, but worker activation is not proven." : "Processing queue is not configured.", [`queue state: ${queueState}`, "No Production queue was provisioned.", "Heavy processing remains outside HTTP by contract."], "Provision a durable queue and verify duplicate, retry, stale-job, and cancellation behavior."),
    item("worker", "INFRASTRUCTURE", "REQUIRES_CONFIGURATION", "No Production worker runtime is configured or verified.", ["Worker readiness is not inferred from queue configuration.", "No background job ran in Production."], "Provision and independently verify the worker runtime, lease, timeout, and retry policy."),
    item("ocr", "INFRASTRUCTURE", "DISABLED", "OCR is explicitly OFF and no OCR provider is configured.", [`OCR status: ${ocrStatus}`, "AI_OCR_ENABLED=false.", "Text-layer extraction remains local-only; scanned PDF is not silently processed."], "Configure OCR separately with page, language, timeout, and cost limits, then run an isolated acceptance review."),
    item("persistence", "APPLICATION", snapshot.persistence === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : snapshot.persistence === "REQUIRES_MIGRATION" ? "REQUIRES_CONFIGURATION" : "NOT_TESTED", snapshot.persistence === "AVAILABLE" ? "AI persistence is available, but activation gates remain OFF." : snapshot.persistence === "REQUIRES_MIGRATION" ? "AI persistence migrations are not applied." : "AI persistence could not be verified in the current environment.", [`persistence state: ${snapshot.persistence}`, "No Production DDL/DML was executed."], "Apply the additive migrations only through a separately authorized, isolated procedure."),
    item("extraction", "APPLICATION", extractors.length > 0 ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", extractors.length > 0 ? "TXT/PDF/DOCX extraction adapters are available for bounded local testing only." : "No extraction adapter is available.", [`available local extractors: ${extractors.join(", ") || "none"}`, "OCR-required documents remain blocked when OCR is unavailable.", "No Production extraction was executed."], "Keep extraction behind private storage, malware scan, queue, and explicit processing gates."),
    item("migrations", "APPLICATION", migrationStatus === "inconsistent" ? "BLOCKED" : migrationStatus === "healthy" ? "READY" : "REQUIRES_CONFIGURATION", migrationStatus === "healthy" ? "Repository and registry order are consistent." : migrationStatus === "inconsistent" ? "Migration registry or ordering is inconsistent." : "Migration registry is pending or unavailable.", [`registry status: ${migrationStatus}`, migration.nextMigration ? `next migration: ${migration.nextMigration}` : "next migration: not verified", "Migration execution was not attempted."], "Resolve registry/configuration in an isolated environment; do not run Production migrations in this phase.", migrationStatus === "inconsistent"),
    item("retention", "OPERATIONS", retention.status === "REQUIRES_CONFIGURATION" ? "REQUIRES_CONFIGURATION" : "READY_WITH_LIMITATIONS", "Retention and deletion executor are not configured; no automatic deletion is enabled.", [`retention status: ${retention.status}`, `automatic deletion enabled: ${retention.policy.automaticDeletionEnabled}`, "No Production deletion or cleanup ran."], "Define and review retention, cascade, orphan cleanup, and user/admin deletion policies before activation."),
    item("rateLimits", "OPERATIONS", "READY_WITH_LIMITATIONS", "Static bounded payload and extraction limits exist; distributed per-user and per-role enforcement is not configured.", [`distributed enforcement: ${operations.rateLimits.distributedEnforcement}`, `max concurrent jobs: ${operations.rateLimits.maxConcurrentJobs}`, "No production traffic limit was measured."], "Configure distributed upload, extraction, generation, retry, and concurrency limits with abuse monitoring."),
    item("costControls", "OPERATIONS", "REQUIRES_CONFIGURATION", "Effective provider token pricing and per-user/per-job budgets are not configured.", [`pricing source: ${operations.costControls.pricingSource}`, `circuit breaker: ${operations.costControls.globalCircuitBreaker}`, "No provider calls or billable inference occurred."], "Configure model pricing, input/output caps, job budgets, circuit breaker, and budget alerts."),
    item("observability", "OPERATIONS", "READY_WITH_LIMITATIONS", "Content-safe event fields are contractually defined, but Production metrics/traces are not configured.", [`allowed telemetry: ${operations.observability.allowedFields.join(", ")}`, `raw content logging: ${operations.observability.rawContentLogging}`, "Production metrics/traces are not configured."], "Connect privacy-safe logs/metrics/traces and verify retention and alerting without recording content."),
    item("audit", "SECURITY", "READY_WITH_LIMITATIONS", "Audit event taxonomy and mapper exist; persistence-backed verification depends on the available audit database.", ["AI audit actions cover document, extraction, generation, review, draft, and publication decisions.", "No AI Production event was generated in this phase."], "Verify audit writes in an isolated environment and review access/retention controls."),
    item("rbac", "SECURITY", "READY", "Existing Admin RBAC preserves AI boundaries: Admin/Super Admin generation policy, Editor review/read policy, and no Moderator AI scope.", ["Readiness endpoint requires ai.documents.read.", "Mutation routes retain server-side permission and same-origin guards."], "Keep least privilege and review role overrides before any activation."),
    item("privacy", "SECURITY", "READY_WITH_LIMITATIONS", "Public AI data isolation and private-by-default contracts are present; real private storage has not been provisioned.", ["Public routes, search, sitemap, OG, and JSON-LD do not project AI documents.", "Public privacy scan is required after every deployment."], "Complete a security review of private storage, signed retrieval, access logs, and deletion before activation."),
    item("promptBoundary", "SECURITY", "READY_WITH_LIMITATIONS", "Prompt construction separates fixed system instructions from untrusted document data; no real provider call was executed.", ["Prompt builder marks instruction-like text without elevating it to instructions.", "Generation validation rejects secret-like and instruction-like output.", "Phase 17.18.4 tests cover prompt-injection boundaries."], "Repeat the boundary test with the approved provider in an isolated environment before activation."),
    item("generation", "APPLICATION", "DISABLED", "Production generation is explicitly OFF even if a provider is later configured.", ["AI_GENERATION_ENABLED=false.", "AI_PRODUCTION_ENABLED=false.", "Generation routes reject before job creation."], "Enable only through a separate change after provider, storage, queue, persistence, cost, and security gates are proven."),
    item("humanReview", "APPLICATION", snapshot.persistence === "AVAILABLE" ? "READY_WITH_LIMITATIONS" : "REQUIRES_CONFIGURATION", "Human review contracts and Admin UI exist, but persistent review state depends on AI migrations.", ["Fact and claim review actions are explicit and bounded.", "AI output remains DRAFT and no auto-publication path exists."], "Verify persisted review/audit behavior in an isolated database before production activation."),
    item("publication", "SECURITY", "DISABLED", "Publication is a hard safety boundary and remains OFF in this phase.", ["AI_PUBLICATION_ENABLED=false.", "No automatic Person/Profile creation or publication path exists."], "Keep disabled until an independently approved editorial publication workflow is verified.", true),
    item("publicationGuard", "SECURITY", "READY", "Publication firewall is explicit: AI results are DRAFT-only and no automatic Person/Profile or public publication path exists.", ["Generation result contract requires draftStatus=DRAFT.", "Generation routes are gate-protected and no publish mutation is present.", "Public projection/search/sitemap do not include AI entities."], "Retain the guard and require a separate editorial approval path for any future publication."),
    item("rollback", "OPERATIONS", "READY_WITH_LIMITATIONS", "Application rollback is available through feature gates and normal deployment rollback; destructive database rollback is intentionally not used.", ["All production AI gates are OFF by default.", "No migration or Production DDL/DML was executed.", "Git history uses normal commits without rewrite."], "Document and rehearse rollback per provider, queue, storage, and database layer before activation."),
  ];
}

export async function getAiProductionReadinessReport(): Promise<AiReadinessReport> {
  const [snapshot, migration] = await Promise.all([getAiWorkspaceSnapshot(), getMigrationPreflight()]);
  const gates = getAiFeatureGates();
  const items = buildItems(snapshot, migration);
  const overall = items.some((entry) => entry.status === "BLOCKED") ? "BLOCKED" : "ACTIVATION_READY_WITH_LIMITATIONS";
  return {
    generatedAt: new Date().toISOString(),
    overall,
    gates,
    items,
    migration: migrationSummary(migration),
  };
}
