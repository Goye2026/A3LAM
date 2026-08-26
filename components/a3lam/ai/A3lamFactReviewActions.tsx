"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Copy = {
  adminAiAccept: string;
  adminAiEdit: string;
  adminAiReject: string;
  adminAiReviewSaving: string;
  adminAiReviewError: string;
};

export function A3lamFactReviewActions({ factId, initialValue, copy }: { factId: string; initialValue: string; copy: Copy }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (decision: "ACCEPTED" | "EDITED" | "REJECTED") => {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/ai/facts/${encodeURIComponent(factId)}/review`, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ decision, ...(decision === "EDITED" ? { reviewedValue: value } : {}) }) });
      if (!response.ok) throw new Error("review_failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return <div className="ai-review-actions"><input value={value} onChange={(event) => setValue(event.target.value)} aria-label={copy.adminAiEdit} disabled={busy} /><div className="ai-review-action-buttons"><button type="button" className="button button-quiet" onClick={() => submit("ACCEPTED")} disabled={busy}>{copy.adminAiAccept}</button><button type="button" className="button button-quiet" onClick={() => submit("EDITED")} disabled={busy}>{copy.adminAiEdit}</button><button type="button" className="button button-quiet" onClick={() => submit("REJECTED")} disabled={busy}>{copy.adminAiReject}</button></div>{busy ? <small role="status">{copy.adminAiReviewSaving}</small> : null}{error ? <small role="alert">{copy.adminAiReviewError}</small> : null}</div>;
}
