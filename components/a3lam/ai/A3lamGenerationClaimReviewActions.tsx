"use client";

import { useState } from "react";
import type { AiGenerationReviewInput } from "@/lib/ai/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

export function A3lamGenerationClaimReviewActions({ claimId, copy, onDone }: { claimId: string; copy: FoundationMessages; onDone: () => void }) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: AiGenerationReviewInput["action"]) {
    setBusy(true);
    setError(null);
    try {
      const body: AiGenerationReviewInput = { action, reviewerNote: note || undefined, reviewedValue: action === "EDIT" ? value : undefined };
      const response = await fetch(`/api/admin/ai/generation/claims/${encodeURIComponent(claimId)}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(copy.adminAiReviewError);
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.adminAiReviewError);
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-inline-actions">
    <label className="sr-only" htmlFor={`claim-value-${claimId}`}>{copy.adminAiReviewValue}</label>
    <input id={`claim-value-${claimId}`} value={value} onChange={(event) => setValue(event.target.value)} placeholder={copy.adminAiEdit} disabled={busy} />
    <label className="sr-only" htmlFor={`claim-note-${claimId}`}>{copy.adminAiReviewNote}</label>
    <input id={`claim-note-${claimId}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy.adminAiReviewNote} disabled={busy} />
    <button type="button" className="button button-quiet" onClick={() => void submit("ACCEPT")} disabled={busy}>{copy.adminAiAccept}</button>
    <button type="button" className="button button-primary" onClick={() => void submit("EDIT")} disabled={busy || !value.trim()}>{copy.adminAiEdit}</button>
    <button type="button" className="button button-quiet" onClick={() => void submit("REQUEST_SOURCE")} disabled={busy}>{copy.adminAiRequestSource}</button>
    <button type="button" className="button button-quiet" onClick={() => void submit("REJECT")} disabled={busy}>{copy.adminAiReject}</button>
    {busy ? <span role="status">{copy.adminAiReviewSaving}</span> : null}
    {error ? <span role="alert">{error}</span> : null}
  </div>;
}
