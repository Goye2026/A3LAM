"use client";

/* Picker renders sanitized external provider URLs; the existing image policy uses the same bounded exception. */
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { getSafePublicImageUrl } from "@/lib/media/public";

export type CmsMediaPickerItem = { id: string; publicUrl: string; originalName: string; altText: string; mimeType: string; sizeBytes: number; width: number | null; height: number | null; license: string; sourceUrl: string | null; visibility: "public" };

type Props = {
  copy: Pick<FoundationMessages, "adminCmsMediaSelect" | "adminCmsMediaPicker" | "adminCmsMediaCancel" | "adminCmsMediaUseSelected" | "adminCmsNoEligibleMedia" | "adminDatabaseError" | "adminCmsMediaPrivate">;
  canSelect: boolean;
  onSelect: (item: CmsMediaPickerItem) => void;
};

export function CmsMediaPicker({ copy, canSelect, onSelect }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<CmsMediaPickerItem[]>([]);
  const [selected, setSelected] = useState<CmsMediaPickerItem | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchItems() {
    setError(""); setLoading(true);
    try {
      const response = await fetch(`/api/admin/media/picker?q=${encodeURIComponent(query.slice(0, 120))}`, { cache: "no-store" });
      if (!response.ok) throw new Error(copy.adminDatabaseError);
      const body = await response.json() as { items?: CmsMediaPickerItem[] };
      setItems(body.items ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setLoading(false); }
  }

  async function open() {
    setError(""); setSelected(null); dialogRef.current?.showModal(); await fetchItems();
  }

  function close() {
    dialogRef.current?.close(); setSelected(null);
  }

  function useSelected() {
    if (!selected) return;
    onSelect(selected); close();
  }

  return <>
    <button className="button button-quiet" type="button" disabled={!canSelect} onClick={() => void open()}>{copy.adminCmsMediaSelect}</button>
    <dialog ref={dialogRef} className="cms-media-picker" aria-labelledby="cms-media-picker-title" onCancel={close}>
      <div className="cms-media-picker-header"><h2 id="cms-media-picker-title">{copy.adminCmsMediaPicker}</h2><button className="button button-quiet" type="button" onClick={close}>{copy.adminCmsMediaCancel}</button></div>
      <label><span>{copy.adminCmsMediaSelect}</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void fetchItems(); } }} maxLength={120} /></label>
      {loading ? <p className="admin-field-hint" role="status">…</p> : null}
      {error ? <p className="admin-alert" role="alert">{error}</p> : null}
      {!loading && items.length === 0 ? <p className="admin-empty">{copy.adminCmsNoEligibleMedia}</p> : <div className="cms-media-picker-grid">{items.map((item) => { const image = getSafePublicImageUrl(item.publicUrl); return <button key={item.id} type="button" className={`cms-media-picker-item${selected?.id === item.id ? " is-selected" : ""}`} onClick={() => setSelected(item)}>{image ? <img src={image} alt={item.altText || item.originalName} width={160} height={100} /> : null}<strong>{item.originalName}</strong><small>{item.mimeType} · {item.sizeBytes.toLocaleString()} bytes</small></button>; })}</div>}
      {selected ? <aside className="cms-media-picker-detail"><strong>{selected.originalName}</strong><span>{selected.width && selected.height ? `${selected.width}×${selected.height}` : "—"}</span><span>{selected.license || copy.adminCmsMediaPrivate}</span><button className="button button-primary" type="button" onClick={useSelected}>{copy.adminCmsMediaUseSelected}</button></aside> : null}
    </dialog>
  </>;
}
