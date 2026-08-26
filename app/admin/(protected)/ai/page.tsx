import type { Metadata } from "next";
import { getAiProviderState } from "@/lib/ai/provider";
import { getAiWorkspaceCapabilities, getAiWorkspaceSnapshot } from "@/lib/ai/workspace";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { A3lamDocumentUploader } from "@/components/a3lam/ai/A3lamDocumentUploader";
import { A3lamFactReviewTable } from "@/components/a3lam/ai/A3lamFactReviewTable";

export const metadata: Metadata = { title: "A3LAM AI · أعلام", robots: { index: false, follow: false } };

function statusText(state: "CONFIGURED" | "REQUIRES_CONFIGURATION" | "INVALID_CONFIGURATION", copy: ReturnType<typeof getMessages>) {
  return state === "CONFIGURED" ? copy.adminAvailable : copy.adminAiConfigurationRequired;
}

export default async function AdminAiPage() {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("system.read");
  if (access.dependencyUnavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p></div>;
  if (!access.principal || !access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;

  const snapshot = getAiWorkspaceSnapshot();
  const capabilities = getAiWorkspaceCapabilities();
  const provider = getAiProviderState();

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

      <section className="admin-stat-grid" aria-label={copy.adminAi}>
        <div className="admin-stat-card"><span>{copy.adminAiProvider}</span><strong>{statusText(provider, copy)}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiDocumentProcessing}</span><strong>{snapshot.documentProcessing === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminMedia}</span><strong>{snapshot.storage === "AVAILABLE" ? copy.adminAvailable : copy.adminAiConfigurationRequired}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminAiDocuments}</span><strong>—</strong></div>
      </section>

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-status-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiProvider}</p><h2 id="ai-status-title">{copy.adminAiConfigurationRequired}</h2></div><span className="admin-launch-status admin-launch-status-requires_configuration">{statusText(provider, copy)}</span></div>
        <p className="admin-field-hint">{copy.adminAiConfigurationRequired}</p>
        <p className="admin-field-hint">{copy.adminAiUploadHint}</p>
      </section>

      <A3lamDocumentUploader copy={copy} disabled />

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-data-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiDocuments}</p><h2 id="ai-data-title">{copy.adminAiNoDocuments}</h2></div><span className="admin-launch-status admin-launch-status-not_tested">{copy.adminAiNoPersistence}</span></div>
        <p className="admin-field-hint">{copy.adminAiNoPersistence}</p>
        <div className="admin-stat-grid ai-stat-grid" aria-label={copy.adminAiDocuments}>
          <div className="admin-stat-card"><span>{copy.adminAiDocuments}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiProcessing}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiCompleted}</span><strong>—</strong></div>
          <div className="admin-stat-card"><span>{copy.adminAiReviewRequired}</span><strong>—</strong></div>
        </div>
      </section>

      <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-contract-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiHumanReview}</p><h2 id="ai-contract-title">{copy.adminAiHumanReview}</h2></div></div>
        <p className="admin-field-hint">{copy.adminAiDraftBoundary}</p>
        <p className="admin-field-hint">{copy.adminAiSupportedTypes}: {capabilities.supportedTypes.join(" · ")}</p>
        <p className="admin-field-hint">{copy.adminAiStructuredFields}</p>
      </section>

      <A3lamFactReviewTable facts={[]} copy={copy} />
    </div>
  );
}
