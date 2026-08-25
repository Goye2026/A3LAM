import Link from "next/link";
import { AdminLifecycleAction } from "@/components/a3lam/AdminLifecycleAction";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ContentStatus } from "@/lib/domain/a3lam";
import { adminRepository } from "@/lib/data/adminRepository";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function statusLabel(status: ContentStatus, copy: ReturnType<typeof getMessages>) {
  return status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : status === "published" ? copy.adminPublished : copy.adminArchived;
}

function transitionLabel(status: ContentStatus, copy: ReturnType<typeof getMessages>) {
  return status === "draft" ? copy.adminSendReview : status === "review" ? copy.adminPublish : status === "published" ? copy.adminArchive : copy.adminRestore;
}

function contentStatus(value: string): ContentStatus | "" {
  return ["draft", "review", "published", "archived"].includes(value) ? value as ContentStatus : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPeoplePage({ searchParams }: PageProps) {
  const copy = getMessages(defaultLocale);
  const params = await searchParams;
  const query = first(params.q);
  const status = contentStatus(first(params.status));
  const categoryId = first(params.category);
  const sort = ["updated_desc", "updated_asc", "name"].includes(first(params.sort)) ? first(params.sort) as "updated_desc" | "updated_asc" | "name" : "updated_desc";
  const page = Math.max(Number.parseInt(first(params.page) || "1", 10) || 1, 1);
  let data: Awaited<ReturnType<typeof adminRepository.listPeople>> | null = null;
  let categories: Awaited<ReturnType<typeof adminRepository.listCategoryOptions>> = [];
  let unavailable = false;
  try {
    [data, categories] = await Promise.all([
      adminRepository.listPeople({ query, status, categoryId, sort, page }),
      adminRepository.listCategoryOptions(),
    ]);
  } catch {
    unavailable = true;
  }
  const hasNext = data ? data.page * data.pageSize < data.total : false;
  const queryParams = { ...(query ? { q: query } : {}), ...(status ? { status } : {}), ...(categoryId ? { category: categoryId } : {}), ...(sort !== "updated_desc" ? { sort } : {}) };
  const previousHref = `/admin/people?${new URLSearchParams({ ...queryParams, page: String(Math.max(page - 1, 1)) })}`;
  const nextHref = `/admin/people?${new URLSearchParams({ ...queryParams, page: String(page + 1) })}`;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminTitle}</p><h1>{copy.adminPeople}</h1><p className="route-description">{copy.adminSubtitle}</p></div>
        <Link className="button button-primary" href="/admin/people/new">{copy.adminAddPerson}</Link>
      </header>
      <form className="admin-filter-form" method="get">
        <label htmlFor="admin-search">{copy.adminSearch}</label>
        <input id="admin-search" className="admin-input" name="q" defaultValue={query} />
        <label htmlFor="admin-status">{copy.adminFilterStatus}</label>
        <select id="admin-status" className="admin-input" name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="review">{copy.adminReview}</option><option value="published">{copy.adminPublished}</option><option value="archived">{copy.adminArchived}</option></select>
        <label htmlFor="admin-category">{copy.adminCategories}</label>
        <select id="admin-category" className="admin-input" name="category" defaultValue={categoryId}><option value="">{copy.adminAllCategories}</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
        <label htmlFor="admin-sort">{copy.adminSort}</label>
        <select id="admin-sort" className="admin-input" name="sort" defaultValue={sort}><option value="updated_desc">{copy.adminSortNewest}</option><option value="updated_asc">{copy.adminSortOldest}</option><option value="name">{copy.adminSortName}</option></select>
        <button className="button button-quiet" type="submit">{copy.adminFilterAction}</button>
      </form>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      <section className="admin-panel" aria-labelledby="admin-people-table-title">
        <div className="admin-section-heading"><h2 id="admin-people-table-title">{copy.adminPeople}</h2><span className="admin-muted">{data?.total ?? 0}</span></div>
        {!data?.items.length ? <p className="admin-empty">{copy.adminNoPeople}</p> : <div className="admin-table-wrap"><table className="admin-table"><caption className="sr-only">{copy.adminPeople}</caption><thead><tr><th scope="col">{copy.adminArabicName}</th><th scope="col">{copy.adminSlug}</th><th scope="col">{copy.adminStatusLabel}</th><th scope="col">{copy.adminCategories}</th><th scope="col">{copy.adminUpdated}</th><th scope="col">{copy.adminFilterAction}</th></tr></thead><tbody>{data.items.map((person) => <tr key={person.id}><th scope="row"><span className="admin-person-name">{person.nameArabic}</span><small>{person.name}</small></th><td dir="ltr">{person.slug}</td><td><b className={`admin-status admin-status-${person.status}`}>{statusLabel(person.status, copy)}</b></td><td>{person.categories.join(" · ") || "—"}</td><td><small>{formatDate(person.updatedAt)}</small></td><td><div className="admin-row-actions"><Link className="admin-table-action" href={`/admin/people/${person.id}`}>{copy.adminEdit}</Link><Link className="admin-table-action" href={`/admin/people/${person.id}/preview`}>{copy.adminPreview}</Link><AdminLifecycleAction id={person.id} status={person.status} label={transitionLabel(person.status, copy)} errorMessage={copy.adminStatusTransitionError} /></div></td></tr>)}</tbody></table></div>}
      </section>
      <nav className="admin-pagination" aria-label={copy.adminPeople}>{page > 1 ? <Link className="button button-quiet" href={previousHref}>{copy.adminPagePrevious}</Link> : <span />}{page} / {data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1}{hasNext ? <Link className="button button-quiet" href={nextHref}>{copy.adminPageNext}</Link> : <span />}</nav>
    </div>
  );
}
