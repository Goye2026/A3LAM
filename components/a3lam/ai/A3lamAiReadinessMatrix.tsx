import type { FoundationMessages } from "@/lib/i18n/messages";
import type { AiReadinessDomain, AiReadinessKey, AiReadinessReport, AiReadinessStatus } from "@/lib/ai/types";

type Copy = FoundationMessages;

const keyLabels: Record<AiReadinessKey, keyof Copy> = {
  authentication: "adminAiReadinessAuthentication",
  rbac: "adminAiReadinessRbac",
  csrf: "adminAiReadinessCsrf",
  documentIngestion: "adminAiReadinessDocumentIngestion",
  privateStorage: "adminAiReadinessPrivateStorage",
  malwareScanner: "adminAiReadinessMalwareScanner",
  extraction: "adminAiReadinessExtraction",
  ocr: "adminAiReadinessOcr",
  queue: "adminAiReadinessQueue",
  worker: "adminAiReadinessWorker",
  aiProvider: "adminAiReadinessAiProvider",
  promptBoundary: "adminAiReadinessPromptBoundary",
  generation: "adminAiReadinessGeneration",
  claimsProvenance: "adminAiReadinessClaimsProvenance",
  humanReview: "adminAiReadinessHumanReview",
  workflowStateMachine: "adminAiReadinessWorkflowStateMachine",
  publicationGuard: "adminAiReadinessPublicationGuard",
  persistence: "adminAiReadinessPersistence",
  migrations: "adminAiReadinessMigrations",
  retention: "adminAiReadinessRetention",
  rateLimits: "adminAiReadinessRateLimits",
  costControls: "adminAiReadinessCostControls",
  observability: "adminAiReadinessObservability",
  audit: "adminAiReadinessAudit",
  rollback: "adminAiReadinessRollback",
  privacy: "adminAiReadinessPrivacy",
  externalQa: "adminAiReadinessExternalQa",
  publication: "adminAiReadinessPublication",
};

const domainLabels: Record<AiReadinessDomain, keyof Copy> = {
  INFRASTRUCTURE: "adminAiReadinessInfrastructure",
  APPLICATION: "adminAiReadinessApplication",
  SECURITY: "adminAiReadinessSecurity",
  OPERATIONS: "adminAiReadinessOperations",
};

function statusLabel(status: AiReadinessStatus, copy: Copy) {
  if (status === "READY") return copy.adminAvailable;
  if (status === "READY_WITH_LIMITATIONS") return copy.adminAiDecisionActivationReadyWithLimitations;
  if (status === "REQUIRES_CONFIGURATION") return copy.adminAiConfigurationRequired;
  if (status === "BLOCKED") return copy.adminAiDecisionBlocked;
  if (status === "DISABLED") return copy.adminAiProductionDisabled;
  if (status === "NOT_TESTED") return copy.adminAiDecisionNotTested;
  return copy.adminAiDecisionNotReady;
}

function decisionLabel(decision: AiReadinessReport["overall"], copy: Copy) {
  if (decision === "ACTIVATION_READY") return copy.adminAiDecisionActivationReady;
  if (decision === "ACTIVATION_READY_WITH_LIMITATIONS") return copy.adminAiDecisionActivationReadyWithLimitations;
  if (decision === "BLOCKED") return copy.adminAiDecisionBlocked;
  return copy.adminAiDecisionNotReady;
}

function gateLabel(key: keyof AiReadinessReport["gates"], copy: Copy) {
  if (key === "AI_UPLOAD_ENABLED") return copy.adminAiGateUpload;
  if (key === "AI_PROCESSING_ENABLED") return copy.adminAiGateProcessing;
  if (key === "AI_GENERATION_ENABLED") return copy.adminAiGateGeneration;
  if (key === "AI_OCR_ENABLED") return copy.adminAiGateOcr;
  return copy.adminAiGatePublication;
}

export function A3lamAiReadinessMatrix({ report, copy }: { report: AiReadinessReport; copy: Copy }) {
  return (
    <section className="admin-panel ai-readiness-panel" aria-labelledby="ai-readiness-title">
      <header className="admin-panel-heading ai-readiness-heading">
        <div>
          <p className="eyebrow">{copy.adminAiReadiness}</p>
          <h2 id="ai-readiness-title">{copy.adminAiReadiness}</h2>
          <p className="admin-field-hint">{copy.adminAiReadinessDescription}</p>
        </div>
        <span className={`admin-launch-status admin-launch-status-${report.overall.toLowerCase()}`} role="status">{decisionLabel(report.overall, copy)}</span>
      </header>

      <div className="ai-readiness-gates" aria-labelledby="ai-gates-title">
        <h3 id="ai-gates-title">{copy.adminAiReadinessGate}</h3>
        <div className="ai-readiness-gate-grid">
          {(Object.entries(report.gates) as Array<[keyof AiReadinessReport["gates"], boolean]>).map(([key, enabled]) => (
            <div className="ai-readiness-gate" key={key}>
              <span>{gateLabel(key, copy)}</span>
              <strong className={enabled ? "is-pass" : "is-blocked"}>{enabled ? copy.adminAvailable : copy.adminAiGateOff}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-readiness-grid">
        {report.items.map((entry) => (
          <article className={`ai-readiness-card ai-readiness-card-${entry.status.toLowerCase()}`} key={entry.key}>
            <header>
              <div><span className="ai-readiness-domain">{copy[domainLabels[entry.domain]]}</span><h3>{copy[keyLabels[entry.key]]}</h3></div>
              <span className="ai-status-pill">{statusLabel(entry.status, copy)}</span>
            </header>
            <dl>
              <div><dt>{copy.adminAiReadinessReason}</dt><dd>{entry.reason}</dd></div>
              <div><dt>{copy.adminAiReadinessLayer}</dt><dd>{entry.layer}</dd></div>
              <div><dt>{copy.adminAiReadinessRisk}</dt><dd>{entry.riskLevel}</dd></div>
              <div><dt>{copy.adminAiReadinessNextStep}</dt><dd>{entry.nextStep}</dd></div>
              <div><dt>{copy.adminAiReadinessOwner}</dt><dd>{entry.owner}</dd></div>
              <div><dt>{copy.adminAiReadinessVerificationMethod}</dt><dd>{entry.verificationMethod}</dd></div>
            </dl>
            <details>
              <summary>{copy.adminAiReadinessEvidence}</summary>
              <ul>{entry.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>
            </details>
            <p className={entry.blocker ? "ai-readiness-blocker" : "ai-readiness-no-blocker"} role={entry.blocker ? "alert" : "status"}>
              {entry.blocker ? copy.adminAiReadinessBlocker : copy.adminAiReadinessNoBlocker}
            </p>
          </article>
        ))}
      </div>

      <div className="ai-readiness-migration" role="status">
        <strong>{copy.adminAiReadinessMigration}</strong>
        <span>{report.migration.status}</span>
        <span>{report.migration.appliedCount === null ? "—" : `${report.migration.appliedCount}/${report.migration.expectedCount} · ${report.migration.pendingCount}`}</span>
        <span>{report.migration.nextMigration ?? "—"}</span>
      </div>
    </section>
  );
}
