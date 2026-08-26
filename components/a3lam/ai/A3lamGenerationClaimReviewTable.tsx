import type { AiGeneratedClaim } from "@/lib/ai/types";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { A3lamGenerationClaimReviewActions } from "./A3lamGenerationClaimReviewActions";

function displayValue(value: unknown) {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return "—"; }
}

function sourceSummary(claim: AiGeneratedClaim) {
  const evidence = claim.provenance.map((item) => item.excerpt).filter(Boolean).join(" · ");
  return evidence.slice(0, 500) || "—";
}

export function A3lamGenerationClaimReviewTable({ claims, copy, onDone }: { claims: AiGeneratedClaim[]; copy: FoundationMessages; onDone?: () => void }) {
  if (claims.length === 0) return <p className="admin-empty" role="status">{copy.adminAiGenerationNoClaims}</p>;
  return <div className="admin-table-wrap">
    <table className="admin-table admin-responsive-table">
      <caption>{copy.adminAiGenerationReview}</caption>
      <thead><tr><th scope="col">{copy.adminAiReviewField}</th><th scope="col">{copy.adminAiReviewValue}</th><th scope="col">{copy.adminAiReviewSource}</th><th scope="col">{copy.adminAiReviewConfidence}</th><th scope="col">{copy.adminAiGenerationQuality}</th><th scope="col">{copy.adminAiReviewAction}</th></tr></thead>
      <tbody>{claims.map((claim) => <tr key={claim.id}>
        <th scope="row">{claim.fieldPath}</th>
        <td>{displayValue(claim.value)}</td>
        <td>{sourceSummary(claim)}</td>
        <td>{claim.confidence}</td>
        <td>{claim.status === "CONFLICTED" ? copy.adminAiConflict : claim.status}</td>
        <td><A3lamGenerationClaimReviewActions claimId={claim.id} copy={copy} onDone={onDone ?? (() => undefined)} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
