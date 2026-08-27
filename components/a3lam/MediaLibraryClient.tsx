"use client";

/* External provider URLs are sanitized through getSafePublicImageUrl before rendering. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { MediaAssetListItem, MediaProviderState } from "@/lib/media/types";
import { getSafePublicImageUrl } from "@/lib/media/public";

type Props = { copy: FoundationMessages; initialItems: MediaAssetListItem[]; provider: MediaProviderState; schemaReady: boolean };

export function MediaLibraryClient({ copy, initialItems, provider, schemaReady }: Props) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | "ready" | "archived">("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const visibleItems = useMemo(() => items.filter((item) => (!query.trim() || item.originalName.toLowerCase().includes(query.trim().toLowerCase())) && (!status || item.status === status)), [items, query, status]);

  async function archive(id: string) {
    setBusyId(id); setFeedback(""); setError("");
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) { setError(response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError); return; }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: "archived", visibility: "private" } : item));
      setFeedback(copy.adminSaved);
    } catch { setError(copy.adminDatabaseError); } finally { setBusyId(null); }
  }

  return <div className="admin-media-library"><div className="admin-media-library-toolbar"><input className="admin-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.adminMediaSelect} aria-label={copy.adminMediaLibrary} /><select className="admin-input" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label={copy.adminMigrationRowStatus}><option value="">{copy.adminAllStatuses}</option><option value="ready">{copy.adminAvailable}</option><option value="archived">{copy.adminMediaArchive}</option></select><div className="admin-media-view-toggle" role="group" aria-label={copy.adminDisplayMode}><button className="button button-quiet" type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>{copy.adminGridView}</button><button className="button button-quiet" type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>{copy.adminListView}</button></div></div>{!schemaReady ? <p className="admin-alert" role="alert">{copy.adminMediaPendingMigration}</p> : provider !== "configured" ? <p className="admin-field-hint">{copy.adminMediaNoProvider}</p> : null}{feedback ? <p className="admin-form-feedback" role="status">{feedback}</p> : null}{error ? <p className="admin-alert" role="alert">{error}</p> : null}{visibleItems.length === 0 ? <p className="admin-empty">{copy.adminMediaNoAssets}</p> : <div className={`admin-media-grid${view === "list" ? " is-list" : ""}`}>{visibleItems.map((item) => { const image = getSafePublicImageUrl(item.publicUrl); return <article className="admin-media-card" key={item.id}>{image ? <img src={image} alt={item.altText || item.originalName} width={180} height={120} loading="lazy" /> : <div className="admin-media-card-fallback" aria-hidden="true">{item.extension.toUpperCase()}</div>}<div className="admin-media-card-body"><div className="admin-section-heading"><h2>{item.originalName}</h2><span className={`admin-status admin-status-${item.status === "ready" ? "published" : "archived"}`}>{item.status}</span></div><p className="admin-field-hint">{item.mimeType} · {item.sizeBytes.toLocaleString()} bytes · {item.width && item.height ? `${item.width}×${item.height}` : "—"}</p><p className="admin-field-hint">{copy.adminPeopleRelated}: {item.usageCount ? item.usages.map((usage) => usage.personNameArabic).join("، ") : "—"}</p><p className="admin-field-hint">{item.license || copy.adminMediaLicense}: {item.sourceUrl || "—"}</p>{item.status === "ready" && item.usageCount === 0 ? <button className="button button-danger" type="button" onClick={() => void archive(item.id)} disabled={busyId === item.id}>{copy.adminMediaArchive}</button> : <span className="admin-field-hint">{item.usageCount ? copy.adminConflictError : copy.adminMediaSafetyNote}</span>}</div></article>; })}</div>}</div>;
}
