import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsEditorialRecord, CmsEntityKind, CmsListPage } from "@/lib/cms/editorialTypes";

type Copy = Pick<FoundationMessages, "adminCmsPages" | "adminCmsPosts" | "adminCmsCreatePage" | "adminCmsCreatePost" | "adminCmsNoItems" | "adminCmsRequiresMigration" | "adminCmsEditor" | "adminEdit" | "adminPreview" | "adminStatusLabel" | "adminDraft" | "adminReview" | "adminPublished" | "adminCmsStatusScheduled" | "adminCmsStatusTrashed" | "adminSearch" | "adminFilterAction" | "adminFilterStatus" | "adminAllStatuses" | "adminPagePrevious" | "adminPageNext" | "adminUpdated" | "adminNotFound" | "adminDatabaseError" | "adminCmsBackToContent" | "adminRequiresSchema">;

function statusLabel(record: CmsEditorialRecord, copy: Copy) {
  if (record.status === "draft") return copy.adminDraft;
  if (record.status === "review") return copy.adminReview;
  if (record.status === "published") return copy.adminPublished;
  if (record.status === "scheduled") return copy.adminCmsStatusScheduled;
  return copy.adminCmsStatusTrashed;
}

export function CmsEditorialList({ kind, data, copy, unavailable = false, query = "", status = "" }: { kind: CmsEntityKind; data: CmsListPage | null; copy: Copy; unavailable?: boolean; query?: string; status?: string }) {
  const basePath = `/admin/content/${kind === "page" ? "pages" : "posts"}`;
  const label = kind === "page" ? copy.adminCmsPages : copy.adminCmsPosts;
  const createLabel = kind === "page" ? copy.adminCmsCreatePage : copy.adminCmsCreatePost;
  if (unavailable) return <section className="admin-panel" aria-labelledby="cms-unavailable-title"><h2 id="cms-unavailable-title">{label}</h2><p className="admin-alert" role="status">{copy.adminCmsRequiresMigration}</p><p className="admin-muted">{copy.adminRequiresSchema}</p></section>;
  if (!data) return <section className="admin-panel"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p></section>;
  return (
    <>
      <section className="admin-panel cms-list-toolbar" aria-label={copy.adminCmsEditor}>
        <form className="admin-filter-form" method="get">
          <label><span>{copy.adminSearch}</span><input name="q" defaultValue={query} maxLength={120} /></label>
          <label><span>{copy.adminFilterStatus}</span><select name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="review">{copy.adminReview}</option><option value="scheduled">{copy.adminCmsStatusScheduled}</option><option value="published">{copy.adminPublished}</option><option value="trashed">{copy.adminCmsStatusTrashed}</option></select></label>
          <button className="button" type="submit">{copy.adminFilterAction}</button>
          <Link className="button button-primary" href={`${basePath}/new`}>{createLabel}</Link>
        </form>
      </section>
      <section className="admin-panel" aria-labelledby="cms-list-title">
        <div className="admin-section-heading"><h2 id="cms-list-title">{label}</h2><span className="admin-muted">{data.total}</span></div>
        {data.items.length === 0 ? <p className="admin-empty">{copy.adminCmsNoItems}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">{label}</th><th scope="col">{copy.adminStatusLabel}</th><th scope="col">{copy.adminUpdated}</th><th scope="col">{copy.adminEdit}</th></tr></thead><tbody>{data.items.map((record) => <tr key={record.id}><th scope="row">{record.title}<small dir="ltr">/{record.slug}</small></th><td><span className={`status-badge status-${record.status}`}>{statusLabel(record, copy)}</span></td><td>{record.updatedAt}</td><td><Link href={`${basePath}/${record.id}`}>{copy.adminEdit}</Link>{record.status === "published" && <Link href={`/${kind === "page" ? "page" : "article"}/${record.slug}`}>{copy.adminPreview}</Link>}</td></tr>)}</tbody></table></div>}
        <nav className="admin-pagination" aria-label={copy.adminCmsEditor}>{data.page > 1 && <Link href={`${basePath}?page=${data.page - 1}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`}>{copy.adminPagePrevious}</Link>}{data.page * data.pageSize < data.total && <Link href={`${basePath}?page=${data.page + 1}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`}>{copy.adminPageNext}</Link>}</nav>
      </section>
    </>
  );
}
