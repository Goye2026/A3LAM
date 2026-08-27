"use client";

import { useCallback, useEffect, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsEntityKind, CmsRevisionDetail, CmsRevisionListItem } from "@/lib/cms/editorialTypes";
import { CmsRichTextRenderer } from "./CmsRichTextRenderer";

type Props = {
  kind: CmsEntityKind;
  contentId: string;
  currentVersion: number;
  copy: Pick<FoundationMessages, "adminCmsRevisionHistory" | "adminCmsCurrentRevision" | "adminCmsRestoreRevision" | "adminCmsRevisionPreview" | "adminCmsNoRevisions" | "adminCmsRevisionRestored" | "adminDatabaseError" | "adminConflictError" | "adminCmsRestoreConfirmation" | "adminCmsRevisionActor" | "adminCmsRevisionVersion" | "adminCmsRevisionDate" | "adminCmsRevisionMetadataOnly" | "adminCmsRevisionCurrentVersion">;
  canRestore: boolean;
};

function formatRevisionDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function CmsRevisionCenter({ kind, contentId, currentVersion, copy, canRestore }: Props) {
  const [items, setItems] = useState<CmsRevisionListItem[]>([]);
  const [selected, setSelected] = useState<CmsRevisionDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/cms/${kind === "page" ? "pages" : "posts"}/${encodeURIComponent(contentId)}/revisions`, { cache: "no-store" });
      if (!response.ok) { setError(copy.adminDatabaseError); return; }
      const body = await response.json() as { items?: CmsRevisionListItem[] };
      setItems(body.items ?? []);
    } catch { setError(copy.adminDatabaseError); }
  }, [contentId, copy.adminDatabaseError, kind]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function preview(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/cms/${kind === "page" ? "pages" : "posts"}/${encodeURIComponent(contentId)}/revisions/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(copy.adminDatabaseError);
      const body = await response.json() as { revision: CmsRevisionDetail };
      setSelected(body.revision);
    } catch { setError(copy.adminDatabaseError); }
  }

  async function restore(id: string) {
    if (!canRestore || !window.confirm(copy.adminCmsRestoreConfirmation)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/cms/${kind === "page" ? "pages" : "posts"}/${encodeURIComponent(contentId)}/revisions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ revisionId: id, expectedVersion: currentVersion }) });
      if (!response.ok) throw new Error(response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError);
      setMessage(copy.adminCmsRevisionRestored);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  return <section className="cms-revision-center" aria-labelledby="cms-revision-title">
    <div className="admin-section-heading"><h2 id="cms-revision-title">{copy.adminCmsRevisionHistory}</h2><span className="admin-muted">{items.length}</span></div>
    <div className="cms-revision-context" role="status"><strong>{copy.adminCmsRevisionCurrentVersion}: v{currentVersion}</strong><span>{copy.adminCmsRevisionMetadataOnly}</span></div>
    {message ? <p className="admin-success" role="status">{message}</p> : null}
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    {items.length === 0 ? <p className="admin-empty">{copy.adminCmsNoRevisions}</p> : <ol className="cms-revision-list">{items.map((item) => <li key={item.id} className={item.isCurrent ? "is-current" : undefined}><div><strong>{item.isCurrent ? copy.adminCmsCurrentRevision : `${copy.adminCmsRevisionVersion} ${item.version}`}</strong><small>{copy.adminCmsRevisionActor}: {item.authorName ?? copy.adminCmsRevisionActor} · {copy.adminCmsRevisionDate}: {formatRevisionDate(item.createdAt)}</small></div><div className="admin-form-actions"><button className="button button-quiet" type="button" onClick={() => void preview(item.id)}>{copy.adminCmsRevisionPreview}</button>{canRestore && !item.isCurrent ? <button className="button" type="button" disabled={busy} onClick={() => void restore(item.id)}>{copy.adminCmsRestoreRevision}</button> : null}</div></li>)}</ol>}
    {selected ? <div className="cms-revision-preview" aria-label={copy.adminCmsRevisionPreview}><h3>{selected.snapshot.title}</h3><p>{selected.snapshot.excerpt}</p><CmsRichTextRenderer document={selected.snapshot.content} /></div> : null}
  </section>;
}
