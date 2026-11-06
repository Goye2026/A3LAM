"use client";

/* External provider URLs are sanitized through getSafePublicImageUrl before rendering. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { MediaAssetListItem, MediaProviderState } from "@/lib/media/types";
import { getSafePublicImageUrl } from "@/lib/media/public";

type Props = { copy: FoundationMessages; initialItems: MediaAssetListItem[]; provider: MediaProviderState; schemaReady: boolean; canManage: boolean };
type StatusFilter = "" | "ready" | "archived";
type TypeFilter = "" | "image/jpeg" | "image/png" | "image/webp";

function formatDate(value: string) { return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatBytes(value: number) { return `${value.toLocaleString("ar-EG")} بايت`; }

export function MediaLibraryClient({ copy, initialItems, provider, schemaReady, canManage }: Props) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [type, setType] = useState<TypeFilter>("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [altText, setAltText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [attribution, setAttribution] = useState("");
  const [license, setLicense] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const visibleItems = useMemo(() => items.filter((item) => (!query.trim() || item.originalName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && (!status || item.status === status) && (!type || item.mimeType === type)), [items, query, status, type]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  function clearFeedback() { setFeedback(""); setError(""); }

  function selectItem(item: MediaAssetListItem) {
    setSelectedId(item.id); setAltText(item.altText); setSourceUrl(item.sourceUrl ?? ""); setAttribution(item.attribution); setLicense(item.license); setVisibility(item.visibility);
  }

  function chooseFile() {
    clearFeedback();
    if (!schemaReady) { setError(copy.adminMediaPendingMigration); return; }
    fileInputRef.current?.click();
  }

  function handleFileSelection(file: File | undefined) {
    clearFeedback();
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setSelectedFile(null); setError("يسمح برفع صور JPEG أو PNG أو WebP فقط."); return; }
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) { setSelectedFile(null); setError("يجب ألا يتجاوز حجم الصورة 5 ميغابايت."); return; }
    setSelectedFile(file);
  }

  async function uploadSelectedFile() {
    if (!selectedFile) { setError("اختر صورة أولًا."); return; }
    if (provider !== "configured") { setError("لا يمكن تنفيذ الرفع قبل إعداد Cloudinary server-side."); return; }
    const succeeded = await upload(selectedFile);
    if (succeeded) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function upload(file: File): Promise<boolean> {
    clearFeedback(); setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file); body.set("altText", altText); body.set("sourceUrl", sourceUrl); body.set("attribution", attribution); body.set("license", license); body.set("visibility", visibility);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = await response.json().catch(() => ({})) as { asset?: MediaAssetListItem; message?: string };
      if (!response.ok || !result.asset) throw new Error(result.message || copy.adminDatabaseError);
      const asset = { ...result.asset, usageCount: 0, usages: [] };
      setItems((current) => [asset, ...current]); setSelectedId(asset.id); setFeedback(copy.adminSaved); return true;
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); return false; }
    finally { setUploading(false); }
  }

  async function saveMetadata() {
    if (!selected) return;
    clearFeedback(); setBusyId(selected.id);
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(selected.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ altText, sourceUrl: sourceUrl || null, attribution, license, visibility }) });
      const result = await response.json().catch(() => ({})) as { asset?: MediaAssetListItem; message?: string };
      if (!response.ok || !result.asset) throw new Error(result.message || copy.adminDatabaseError);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...result.asset } : item)); setFeedback(copy.adminSaved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusyId(null); }
  }

  async function archive(id: string) {
    clearFeedback(); setBusyId(id);
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: "archived", visibility: "private" } : item)); setFeedback(copy.adminSaved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusyId(null); }
  }

  return <div className="admin-media-library">
    <div className="admin-media-library-toolbar">
      <label className="admin-media-filter"><span>{copy.adminSearch}</span><input className="admin-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.adminMediaSelect} aria-label={copy.adminSearch} maxLength={120} /></label>
      <label className="admin-media-filter"><span>{copy.adminFilterStatus}</span><select className="admin-input" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="">{copy.adminAllStatuses}</option><option value="ready">{copy.adminAvailable}</option><option value="archived">{copy.adminMediaArchive}</option></select></label>
      <label className="admin-media-filter"><span>{copy.adminMediaMimeType}</span><select className="admin-input" value={type} onChange={(event) => setType(event.target.value as TypeFilter)}><option value="">{copy.adminAllStatuses}</option><option value="image/jpeg">image/jpeg</option><option value="image/png">image/png</option><option value="image/webp">image/webp</option></select></label>
      <div className="admin-media-view-toggle" role="group" aria-label={copy.adminDisplayMode}><button className="button button-quiet" type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>{copy.adminGridView}</button><button className="button button-quiet" type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>{copy.adminListView}</button></div>
    </div>
    {canManage ? <section className="admin-media-upload-panel" aria-labelledby="admin-media-upload-title"><div><h2 id="admin-media-upload-title">{copy.adminMediaUploadLibrary}</h2><p className="admin-field-hint">{copy.adminMediaSafetyNote}</p></div><div className="admin-media-upload-fields"><label><span>{copy.adminMediaAltText}</span><input className="admin-input" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={1000} /></label><label><span>{copy.adminMediaSource}</span><input className="admin-input" dir="ltr" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label><label><span>{copy.adminMediaAttribution}</span><input className="admin-input" value={attribution} onChange={(event) => setAttribution(event.target.value)} maxLength={1000} /></label><label><span>{copy.adminMediaLicense}</span><input className="admin-input" value={license} onChange={(event) => setLicense(event.target.value)} maxLength={300} /></label><label><span>{copy.adminMediaVisibility}</span><select className="admin-input" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}><option value="private">{copy.adminMediaPrivate}</option><option value="public">{copy.adminMediaPublic}</option></select></label></div><div className="admin-media-upload-actions"><input ref={fileInputRef} className="admin-visually-hidden-input" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || !schemaReady} onChange={(event) => { handleFileSelection(event.target.files?.[0]); }} /><button className="button button-primary admin-media-file-button" type="button" onClick={chooseFile} disabled={uploading || !schemaReady}>{copy.adminMediaSelect}</button><button className="button button-quiet" type="button" onClick={() => void uploadSelectedFile()} disabled={uploading || !selectedFile || provider !== "configured" || !schemaReady}>{uploading ? copy.adminSaving : "رفع الصورة"}</button></div>{selectedFile ? <p className="admin-form-feedback" role="status">تم اختيار: <strong dir="ltr">{selectedFile.name}</strong></p> : null}{provider !== "configured" ? <p className="admin-field-hint">{copy.adminMediaNoProvider} يتطلب الرفع إعداد متغيرات Cloudinary server-side.</p> : null}</section> : null}
    {!schemaReady ? <p className="admin-alert" role="alert">{copy.adminMediaPendingMigration}</p> : null}
    {feedback ? <p className="admin-form-feedback" role="status">{feedback}</p> : null}
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    {visibleItems.length === 0 ? <p className="admin-empty">{copy.adminMediaNoAssets}</p> : <div className={`admin-media-grid${view === "list" ? " is-list" : ""}`}>{visibleItems.map((item) => { const image = getSafePublicImageUrl(item.publicUrl); return <article className={`admin-media-card${selectedId === item.id ? " is-selected" : ""}`} key={item.id}><button type="button" className="admin-media-card-select" onClick={() => selectItem(item)} aria-pressed={selectedId === item.id}>{image ? <img src={image} alt={item.altText || item.originalName} width={180} height={120} loading="lazy" /> : <div className="admin-media-card-fallback" aria-hidden="true">{item.extension.toUpperCase()}</div>}<span className="admin-media-card-body"><span className="admin-section-heading"><strong>{item.originalName}</strong><small className={`admin-status admin-status-${item.status === "ready" ? "published" : "archived"}`}>{item.status}</small></span><span className="admin-field-hint">{item.mimeType} · {formatBytes(item.sizeBytes)} · {item.width && item.height ? `${item.width}×${item.height}` : "—"}</span><span className="admin-field-hint">{copy.adminMediaUsage}: {item.usageCount ? item.usages.map((usage) => usage.personNameArabic).join("، ") : "—"}</span></span></button></article>; })}</div>}
    {selected ? <aside className="admin-media-details" aria-labelledby="admin-media-details-title"><div className="admin-section-heading"><h2 id="admin-media-details-title">{copy.adminMediaDetails}</h2><span className="admin-muted">{selected.status}</span></div>{getSafePublicImageUrl(selected.publicUrl) ? <img className="admin-media-details-preview" src={getSafePublicImageUrl(selected.publicUrl) ?? undefined} alt={altText || selected.originalName} width={360} height={240} /> : null}<dl className="admin-media-details-list"><div><dt>{copy.adminMediaFileName}</dt><dd>{selected.originalName}</dd></div><div><dt>{copy.adminMediaMimeType}</dt><dd dir="ltr">{selected.mimeType}</dd></div><div><dt>{copy.adminMediaFileSize}</dt><dd>{formatBytes(selected.sizeBytes)}</dd></div><div><dt>{copy.adminMediaDimensions}</dt><dd>{selected.width && selected.height ? `${selected.width}×${selected.height}` : "—"}</dd></div><div><dt>{copy.adminMediaCreatedAt}</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt>{copy.adminMediaUsage}</dt><dd>{selected.usageCount ? selected.usages.map((usage) => usage.personNameArabic).join("، ") : "—"}</dd></div><div><dt>URL</dt><dd dir="ltr"><a href={selected.publicUrl} target="_blank" rel="noreferrer">{selected.publicUrl}</a></dd></div></dl>{canManage ? <div className="admin-media-details-form"><label><span>{copy.adminMediaAltText}</span><input className="admin-input" value={altText} onChange={(event) => setAltText(event.target.value)} /></label><label><span>{copy.adminMediaSource}</span><input className="admin-input" dir="ltr" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label><label><span>{copy.adminMediaAttribution}</span><input className="admin-input" value={attribution} onChange={(event) => setAttribution(event.target.value)} /></label><label><span>{copy.adminMediaLicense}</span><input className="admin-input" value={license} onChange={(event) => setLicense(event.target.value)} /></label><label><span>{copy.adminMediaVisibility}</span><select className="admin-input" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}><option value="private">{copy.adminMediaPrivate}</option><option value="public">{copy.adminMediaPublic}</option></select></label><div className="admin-form-actions"><button className="button button-primary" type="button" onClick={() => void saveMetadata()} disabled={busyId === selected.id}>{copy.adminMediaSaveMetadata}</button>{selected.status === "ready" && selected.usageCount === 0 ? <button className="button button-danger" type="button" onClick={() => void archive(selected.id)} disabled={busyId === selected.id}>{copy.adminMediaArchive}</button> : <span className="admin-field-hint">{selected.usageCount ? copy.adminConflictError : copy.adminMediaSafetyNote}</span>}</div></div> : null}</aside> : null}
  </div>;
}
