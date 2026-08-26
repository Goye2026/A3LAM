import type { FoundationMessages } from "@/lib/i18n/messages";
import { A3lamFactReviewActions } from "./A3lamFactReviewActions";
import type { HumanReviewFact } from "@/lib/ai/types";

function displayValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function safeSourceUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function sourceSummary(fact: HumanReviewFact) {
  const source = fact.provenance[0];
  if (!source) return "—";
  const details = [source.fileName, source.page ? `p. ${source.page}` : null, source.section, source.excerpt].filter(Boolean);
  return details.join(" · ") || source.sourceType;
}

export function A3lamFactReviewTable({ facts, copy }: { facts: HumanReviewFact[]; copy: Pick<FoundationMessages, "adminAiReviewField" | "adminAiReviewValue" | "adminAiReviewSource" | "adminAiReviewConfidence" | "adminAiReviewClassification" | "adminAiReviewAction" | "adminAiNoFacts" | "adminAiAccept" | "adminAiEdit" | "adminAiReject" | "adminAiReviewSaving" | "adminAiReviewError"> }) {
  return (
    <section className="admin-panel ai-workspace-panel" aria-labelledby="ai-facts-title">
      <div className="admin-panel-heading">
        <div><p className="eyebrow">{copy.adminAiReviewField}</p><h2 id="ai-facts-title">{copy.adminAiReviewValue}</h2></div>
      </div>
      {facts.length === 0 ? <p className="admin-empty" role="status">{copy.adminAiNoFacts}</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-responsive-table">
            <thead><tr><th scope="col">{copy.adminAiReviewField}</th><th scope="col">{copy.adminAiReviewValue}</th><th scope="col">{copy.adminAiReviewSource}</th><th scope="col">{copy.adminAiReviewConfidence}</th><th scope="col">{copy.adminAiReviewClassification}</th><th scope="col">{copy.adminAiReviewAction}</th></tr></thead>
            <tbody>{facts.map((fact) => {
              const sourceUrl = safeSourceUrl(fact.provenance[0]?.sourceUrl);
              return <tr key={fact.id}><th scope="row">{fact.fieldPath}</th><td>{displayValue(fact.value)}</td><td>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">{sourceSummary(fact)}</a> : sourceSummary(fact)}</td><td>{fact.confidence}</td><td>{fact.classification}</td><td>{fact.allowedActions.includes("ACCEPT") ? <A3lamFactReviewActions factId={fact.id} initialValue={displayValue(fact.value)} copy={copy} /> : fact.allowedActions.join(" · ") || "—"}</td></tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
