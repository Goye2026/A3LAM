import type { Metadata } from "next";
import { A3lamDocumentUploader } from "@/components/a3lam/ai/A3lamDocumentUploader";
import { A3lamFactReviewTable } from "@/components/a3lam/ai/A3lamFactReviewTable";
import { A3lamGenerationClaimReviewTable } from "@/components/a3lam/ai/A3lamGenerationClaimReviewTable";
import { A3lamEditorialWorkspace } from "@/components/a3lam/ai/A3lamEditorialWorkspace";
import { A3lamAiReadinessMatrix } from "@/components/a3lam/ai/A3lamAiReadinessMatrix";
import { getAiProviderState } from "@/lib/ai/provider";
import { getAdminAiDocumentPrivateDetail, listAdminAiDocuments, listAdminAiFacts } from "@/lib/ai/persistence";
import { getAdminAiGenerationDocumentDetail } from "@/lib/ai/generation/persistence";
import { getAiWorkspaceCapabilities, getAiWorkspaceSnapshot } from "@/lib/ai/workspace";
import { getAiProductionReadinessReport } from "@/lib/ai/readiness";
import type { HumanReviewFact } from "@/lib/ai/types";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "A3LAM AI · أعلام", robots: { index: false, follow: false } };

type PageProps = { searchParams?: Promise<{ document?: string }> };

type ProviderCopy = ReturnType<typeof getMessages>;

function statusText(state: "CONFIGURED" | "REQUIRES_CONFIGURATION" | "INVALID_CONFIGURATION", copy: ProviderCopy) {
  return state === "CONFIGURED" ? copy.adminAvailable : copy.adminAiConfigurationRequired;
}

function reviewFactsFromPersisted(facts: Awaited<ReturnType<typeof listAdminAiFacts>>): HumanReviewFact[] {
  return facts.map((fact) => ({ ...fact, allowedActions: fact.reviewStatus === "UNREVIEWED" ? ["ACCEPT", "EDIT", "REJECT"] : ["MARK_FOR_VERIFICATION"] }));
}

export default async function AdminAiPage({ searchParams }: PageProps) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("ai.documents.read");
  if (access.dependencyUnavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p></div>;
  if (!access.principal || !access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;

  const [snapshot, readiness] = await Promise.all([getAiWorkspaceSnapshot(), getAiProductionReadinessReport()]);
  const capabilities = getAiWorkspaceCapabilities();
  const provider = getAiProviderState();
  let documents: Awaited<ReturnType<typeof listAdminAiDocuments>> = { items: [], total: 0, page: 1, pageSize: 20 };
  let persistenceUnavailable = snapshot.persistence !== "AVAILABLE";
  try {
    documents = await listAdminAiDocuments();
  } catch {
    persistenceUnavailable = true;
  }
  const requestedDocument = (await searchParams)?.document?.trim() || null;
  const selectedDocument = requestedDocument ? documents.items.find((item) => item.id === requestedDocument) ?? null : null;
  const persistedFacts = selectedDocument && !persistenceUnavailable ? await listAdminAiFacts(selectedDocument.id).catch(() => []) : [];
  const privateDetail = selectedDocument && !persistenceUnavailable ? await getAdminAiDocumentPrivateDetail(selectedDocument.id).catch(() => null) : null;
  const generationDetail = selectedDocument && !persistenceUnavailable ? await getAdminAiGenerationDocumentDetail(selectedDocument.id).catch(() => null) : null;
  const generationJob = generationDetail?.jobs[0] ?? null;
  const generationClaims = generationDetail?.claims ?? [];
  const reviewFacts = reviewFactsFromPersisted(persistedFacts);
  const persistenceLabel = persistenceUnavailable ? (snapshot.persistence === "REQUIRES_MIGRATION" ? copy.adminAiRequiresMigration : copy.adminDatabaseError) : copy.adminAvailable;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div>
          <p className="eyebrow">{copy.adminAi}</p>
          <h1>{copy.adminAi}</h1>
          <p className="route-description">{copy.adminAiDescription}</p>
        </div>
      </header>

      <div className="admin-alert" role="status">
        <strong>{copy.adminAiPrivacyNotice}</strong>
        <p>{copy.adminAiNoInference}</p>
      </div>

      <A3lamEditorialWorkspace copy={copy} />
      <A3lamAiReadinessMatrix report={readiness} copy={copy} />

      <section className="admin-stat-grid" aria-label={copy.adminAi}>
        <div className="admin-stat-card"><span>{copy.adminAiActivation}</span><strong>{snapshot.activation === "DISABLED" ? copy.adminAiActivationDisabled : copy.adminAiActivationEnabled}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiProvider}</span><strong>{statusText(provider, copy)}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiDocumentProcessing}</span><strong>{snapshot.documentProcessing === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminMedia}</span><strong>{snapshot.storage === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiQueue}</span><strong>{snapshot.queue === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiMalwareScanning}</span><strong>{snapshot.malwareScanning === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiRetention}</span><strong>{snapshot.retentionPolicy === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiDocuments}</span><strong>{persistenceUnavailable ? "—" : documents.total}</strong></div>
      </section>

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-status-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiProvider}</p><h2 id="ai-status-title">{copy.adminAiConfigurationRequired}</h2></div><span className="admin-launch-status admin-launch-status-requires_configuration">{statusText(provider, copy)}</span></div>
        <p className="admin-field-hint">{copy.adminAiConfigurationRequired}</p>
        <p className="admin-field-hint">{copy.adminAiUploadHint}</p>
      </section>

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-generation-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiGeneration}</p><h2 id="ai-generation-title">{copy.adminAiGeneration}</h2></div><span className="admin-launch-status admin-launch-status-requires_configuration">{snapshot.generationProvider === "READY" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</span></div>
        <p className="admin-field-hint">{copy.adminAiGenerationProvider}: {snapshot.generationProvider === "READY" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</p>
        <p className="admin-field-hint">{copy.adminAiGenerationDisabled}</p>
        <p className="admin-field-hint">{copy.adminAiGenerationDraft}</p>
        <p className="admin-field-hint">{copy.adminAiGenerationModes}</p>
        <p className="admin-field-hint">{copy.adminAiOutputLanguages}</p>
        <div className="admin-stat-grid ai-stat-grid" aria-label={copy.adminAiPipeline}>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineUploaded}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineExtracted}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineFacts}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineGeneration}</span><strong>{generationJob?.status ?? "—"}</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineReview}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiPipelineApproved}</span><strong>—</strong></div>
        </div>
        <p className="admin-field-hint">{copy.adminAiGenerationStatus}: {generationJob?.status ?? "—"}</p>
        <p className="admin-field-hint">{copy.adminAiGenerationQuality}: {generationJob?.qualityGate ?? "—"}</p>
        <p className="admin-field-hint">{copy.adminAiGenerationReview}</p>
        <A3lamGenerationClaimReviewTable claims={generationClaims} copy={copy} />
      </section>

      <A3lamDocumentUploader copy={copy} disabled />

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-data-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiDocuments}</p><h2 id="ai-data-title">{persistenceUnavailable ? copy.adminAiRequiresMigration : copy.adminAiNoDocuments}</h2></div><span className="admin-launch-status admin-launch-status-not_tested">{persistenceLabel}</span></div>
        <p className="admin-field-hint">{persistenceUnavailable ? copy.adminAiReviewUnavailable : copy.adminAiNoPersistence}</p>
        {documents.items.length === 0 ? <p className="admin-empty" role="status">{copy.adminAiNoDocuments}</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-responsive-table"><thead><tr><th scope="col">{copy.adminAiDocuments}</th><th scope="col">{copy.adminAiDocumentStatus}</th><th scope="col">{copy.adminAiReviewAction}</th></tr></thead><tbody>
              {documents.items.map((document) => <tr key={document.id}><th scope="row">{document.originalFilename}</th><td>{document.ingestionStatus}</td><td><a className="button button-quiet" href={`/admin/ai?document=${encodeURIComponent(document.id)}`}>{copy.adminAiHumanReview}</a></td></tr>)}
            </tbody></table>
          </div>
        )}
        <div className="admin-stat-grid ai-stat-grid" aria-label={copy.adminAiDocuments}>
          <div className="admin-stat-card"><span>{copy.adminAiDocuments}</span><strong>{persistenceUnavailable ? "—" : documents.total}</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiProcessing}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiCompleted}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiReviewRequired}</span><strong>—</strong></div>
        </div>
      </section>

      {selectedDocument ? <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-selected-document-title"><div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiDocuments}</p><h2 id="ai-selected-document-title">{selectedDocument.originalFilename}</h2></div><span className="admin-launch-status admin-launch-status-not_tested">{selectedDocument.ingestionStatus}</span></div><p className="admin-field-hint">{copy.adminAiPrivacyNotice}</p><section aria-labelledby="ai-extracted-text-title"><h3 id="ai-extracted-text-title">{copy.adminAiExtractedText}</h3>{privateDetail?.sources.length ? privateDetail.sources.map((source) => <details key={source.id}><summary>{source.extractor} · {source.extractionStatus}</summary><pre className="ai-private-text">{source.normalizedText}</pre></details>) : <p className="admin-empty">{copy.adminAiNoExtractedText}</p>}</section><A3lamFactReviewTable facts={reviewFacts} copy={copy} /></section> : <A3lamFactReviewTable facts={[]} copy={copy} />}

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-contract-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiExtractionCapability}</p><h2 id="ai-contract-title">{copy.adminAiExtractionCapability}</h2></div></div>
        <p className="admin-field-hint">{copy.adminAiDraftBoundary}</p>
        <p className="admin-field-hint">{copy.adminAiSupportedTypes}: {capabilities.supportedTypes.join(" · ")}</p>
        <p className="admin-field-hint">{copy.adminAiLimits}</p>
        <div className="admin-table-wrap">
          <table className="admin-table admin-responsive-table"><caption>{copy.adminAiParserStatus}</caption><thead><tr><th scope="col">{copy.adminAiSupportedTypes}</th><th scope="col">{copy.adminAiParserStatus}</th></tr></thead><tbody>
            {capabilities.supportedTypes.map((type) => <tr key={type}><th scope="row">{type.toUpperCase()}</th><td>{capabilities.parserStatus[type] === "AVAILABLE_LOCAL_ONLY" ? copy.adminAiParserAvailable : copy.adminAiParserUnavailable}</td></tr>)}
          </tbody></table>
        </div>
        <p className="admin-field-hint">{copy.adminAiStructuredFields}</p>
      </section>
    </div>
  );
}
