"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsEditorialRecord, CmsEntityKind, CmsListPage } from "@/lib/cms/editorialTypes";
import { canTransitionCmsEditorialStatus, type CmsEditorialStatus } from "@/lib/cms/editorialStatus";
import { AdminErrorState, AdminUnavailableState } from "@/components/a3lam/AdminDesignSystem";

type Copy = Pick<FoundationMessages, "adminCmsPages" | "adminCmsPosts" | "adminCmsCreatePage" | "adminCmsCreatePost" | "adminCmsNoItems" | "adminCmsRequiresMigration" | "adminCmsEditor" | "adminEdit" | "adminPreview" | "adminStatusLabel" | "adminDraft" | "adminReview" | "adminPublished" | "adminCmsStatusScheduled" | "adminCmsStatusTrashed" | "adminSearch" | "adminFilterAction" | "adminFilterStatus" | "adminAllStatuses" | "adminPagePrevious" | "adminPageNext" | "adminUpdated" | "adminDatabaseError" | "adminCmsBulkActions" | "adminCmsSelectAll" | "adminCmsSelectedCount" | "adminCmsMoveToTrash" | "adminCmsRestoreSelected" | "adminCmsSendToReview" | "adminSaved" | "adminConflictError" | "adminRequiresSchema">;
type Capabilities = { canUpdate: boolean; canReview: boolean; canTrash: boolean };

function statusLabel(record: CmsEditorialRecord, copy: Copy) { if (record.status === "draft") return copy.adminDraft; if (record.status === "review") return copy.adminReview; if (record.status === "published") return copy.adminPublished; if (record.status === "scheduled") return copy.adminCmsStatusScheduled; return copy.adminCmsStatusTrashed; }

export function CmsEditorialList({ kind, data, copy, unavailable = false, query = "", status = "", capabilities }: { kind: CmsEntityKind; data: CmsListPage | null; copy: Copy; unavailable?: boolean; query?: string; status?: string; capabilities: Capabilities }) {
  const basePath = `/admin/content/${kind === "page" ? "pages" : "posts"}`;
  const label = kind === "page" ? copy.adminCmsPages : copy.adminCmsPosts;
  const createLabel = kind === "page" ? copy.adminCmsCreatePage : copy.adminCmsCreatePost;
  const [items, setItems] = useState<CmsEditorialRecord[]>(data?.items ?? []);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedRecords = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);
  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id));

  function toggleAll() { setSelected(allSelected ? [] : items.map((item) => item.id)); }
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function bulkTransition(next: Extract<CmsEditorialStatus, "draft" | "review" | "trashed">) {
    if (selectedRecords.length === 0) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch(`${basePath}/bulk`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: selectedRecords.map((item) => item.id), status: next, expectedVersions: Object.fromEntries(selectedRecords.map((item) => [item.id, item.version])) }) });
      const body = await response.json().catch(() => ({})) as { updated?: CmsEditorialRecord[]; error?: string };
      if (!response.ok) throw new Error(response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError);
      const updatedById = new Map((body.updated ?? []).map((item) => [item.id, item]));
      setItems((current) => current.map((item) => updatedById.get(item.id) ?? item)); setSelected([]); setMessage(copy.adminSaved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  const canSendReview = capabilities.canReview && selectedRecords.length > 0 && selectedRecords.every((item) => canTransitionCmsEditorialStatus(item.status, "review"));
  const canTrash = capabilities.canTrash && selectedRecords.length > 0 && selectedRecords.every((item) => canTransitionCmsEditorialStatus(item.status, "trashed"));
  const canRestore = capabilities.canUpdate && selectedRecords.length > 0 && selectedRecords.every((item) => canTransitionCmsEditorialStatus(item.status, "draft"));

  if (unavailable) return <section className="admin-panel" aria-labelledby="cms-unavailable-title"><h2 id="cms-unavailable-title">{label}</h2><AdminUnavailableState title={copy.adminCmsRequiresMigration} description={copy.adminRequiresSchema} /></section>;
  if (!data) return <section className="admin-panel"><AdminErrorState title={copy.adminDatabaseError} /></section>;
  return <>
    <section className="admin-panel cms-list-toolbar" aria-label={copy.adminCmsEditor}><form className="admin-filter-form" method="get"><label><span>{copy.adminSearch}</span><input name="q" defaultValue={query} maxLength={120} /></label><label><span>{copy.adminFilterStatus}</span><select name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="review">{copy.adminReview}</option><option value="scheduled">{copy.adminCmsStatusScheduled}</option><option value="published">{copy.adminPublished}</option><option value="trashed">{copy.adminCmsStatusTrashed}</option></select></label><button className="button" type="submit">{copy.adminFilterAction}</button><Link className="button button-primary" href={`${basePath}/new`}>{createLabel}</Link></form></section>
    <section className="admin-panel" aria-labelledby="cms-list-title"><div className="admin-section-heading"><h2 id="cms-list-title">{label}</h2><span className="admin-muted">{data.total}</span></div>{message ? <p className="admin-success" role="status">{message}</p> : null}{error ? <p className="admin-alert" role="alert">{error}</p> : null}<div className="cms-bulk-toolbar"><strong>{copy.adminCmsBulkActions}</strong><span>{copy.adminCmsSelectedCount}: {selected.length}</span><button className="button button-quiet" type="button" onClick={toggleAll} disabled={items.length === 0}>{copy.adminCmsSelectAll}</button><button className="button" type="button" disabled={!canSendReview || busy} onClick={() => void bulkTransition("review")}>{copy.adminCmsSendToReview}</button><button className="button" type="button" disabled={!canRestore || busy} onClick={() => void bulkTransition("draft")}>{copy.adminCmsRestoreSelected}</button><button className="button button-danger" type="button" disabled={!canTrash || busy} onClick={() => void bulkTransition("trashed")}>{copy.adminCmsMoveToTrash}</button></div>{items.length === 0 ? <p className="admin-empty">{copy.adminCmsNoItems}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={copy.adminCmsSelectAll} /></th><th scope="col">{label}</th><th scope="col">{copy.adminStatusLabel}</th><th scope="col">{copy.adminUpdated}</th><th scope="col">{copy.adminEdit}</th></tr></thead><tbody>{items.map((record) => <tr key={record.id}><td><input type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id)} aria-label={`${copy.adminCmsSelectAll}: ${record.title}`} /></td><th scope="row">{record.title}<small dir="ltr">/{record.slug}</small></th><td><span className={`status-badge status-${record.status}`}>{statusLabel(record, copy)}</span></td><td>{record.updatedAt}</td><td><Link href={`${basePath}/${record.id}`}>{copy.adminEdit}</Link>{record.status === "published" && <Link href={`/${kind === "page" ? "page" : "article"}/${record.slug}`}>{copy.adminPreview}</Link>}</td></tr>)}</tbody></table></div>}<nav className="admin-pagination" aria-label={copy.adminCmsEditor}>{data.page > 1 && <Link href={`${basePath}?page=${data.page - 1}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`}>{copy.adminPagePrevious}</Link>}{data.page * data.pageSize < data.total && <Link href={`${basePath}?page=${data.page + 1}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`}>{copy.adminPageNext}</Link>}</nav></section>
  </>;
}
