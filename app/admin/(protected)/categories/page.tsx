import Link from "next/link";
import { AdminCategoryForm } from "@/components/a3lam/AdminCategoryForm";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ContentStatus } from "@/lib/domain/a3lam";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";

function statusLabel(status: ContentStatus, copy: ReturnType<typeof getMessages>) {
  return status === "published" ? copy.adminPublished : status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : copy.adminArchived;
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("categories.read");
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const canEdit = access.principal ? (await hasEffectiveAdminPermission(access.principal, "categories.create")) || (await hasEffectiveAdminPermission(access.principal, "categories.update")) : false;
  const params = await searchParams;
  const editId = first(params.edit);
  const query = first(params.q);
  const status = ["draft", "review", "published", "archived"].includes(first(params.status)) ? first(params.status) as ContentStatus : "";
  let categories: Awaited<ReturnType<typeof adminRepository.listCategorySummaries>> = [];
  let unavailable = false;

  try {
    categories = await adminRepository.listCategorySummaries({ query, status });
  } catch {
    unavailable = true;
  }

  const editing = editId ? categories.find((category) => category.id === editId) : undefined;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminTitle}</p><h1>{copy.adminCategories}</h1><p className="route-description">{copy.adminSubtitle}</p></div>
        {editing ? <Link className="button button-quiet" href="/admin/categories">{copy.adminCreateCategory}</Link> : null}
      </header>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      {!unavailable ? <AdminCategoryForm key={editing?.id ?? "new"} copy={copy} category={editing} canEdit={canEdit} /> : null}
      {editId && !editing && !unavailable ? <p className="admin-alert" role="alert">{copy.adminNotFound}</p> : null}
      <section className="admin-panel" aria-labelledby="admin-categories-table-title">
        <div className="admin-section-heading"><h2 id="admin-categories-table-title">{copy.adminCategories}</h2><span className="admin-muted">{categories.length}</span></div>
        <form className="admin-inline-filter" method="get"><label htmlFor="admin-category-query">{copy.adminSearch}</label><input id="admin-category-query" name="q" defaultValue={query} /><label htmlFor="admin-category-status">{copy.adminFilterStatus}</label><select id="admin-category-status" name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="review">{copy.adminReview}</option><option value="published">{copy.adminPublished}</option><option value="archived">{copy.adminArchived}</option></select><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button></form>
        {categories.length === 0 ? <p className="admin-empty">{copy.adminNoCategories}</p> : <div className="admin-table-wrap"><table className="admin-table"><caption className="sr-only">{copy.adminCategories}</caption><thead><tr><th scope="col">{copy.adminCategoryName}</th><th scope="col">{copy.adminSlug}</th><th scope="col">{copy.adminStatusLabel}</th><th scope="col">{copy.adminPeopleRelated}</th><th scope="col">{copy.adminProfilesRelated}</th><th scope="col">{copy.adminCategoryDescription}</th><th scope="col">{copy.adminEdit}</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><th scope="row">{category.name}</th><td dir="ltr">{category.slug}</td><td><b className={`admin-status admin-status-${category.status}`}>{statusLabel(category.status, copy)}</b></td><td>{category.peopleCount}</td><td>{category.profileCount}</td><td>{category.description}</td><td><Link className="admin-table-action" href={`/admin/categories?edit=${encodeURIComponent(category.id)}`}>{copy.adminEdit}</Link></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
