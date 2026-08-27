import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { CmsEditorialList } from "@/components/a3lam/CmsEditorialList";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const current = params[key];
  return Array.isArray(current) ? current[0] ?? "" : current ?? "";
}

async function loadPageList(page: number, query: string, status: string) {
  try {
    const data = await editorialRepository.list("page", { page: Number.isInteger(page) && page > 0 ? page : 1, query, status: ["draft", "review", "scheduled", "published", "trashed"].includes(status) ? status as "draft" | "review" | "scheduled" | "published" | "trashed" : "" });
    return { data, unavailable: false };
  } catch {
    return { data: null, unavailable: true };
  }
}

export default async function AdminPagesPage({ searchParams }: { searchParams: SearchParams }) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("content.read");
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  const query = value(params, "q");
  const status = value(params, "status");
  const page = Number(value(params, "page") || "1");
  const result = await loadPageList(page, query, status);
  let capabilities = { canUpdate: false, canReview: false, canTrash: false };
  if (access.principal) {
    try {
      const [canUpdate, canReview, canTrash] = await Promise.all([hasEffectiveAdminPermission(access.principal, "content.update"), hasEffectiveAdminPermission(access.principal, "content.review"), hasEffectiveAdminPermission(access.principal, "content.trash")]);
      capabilities = { canUpdate, canReview, canTrash };
    } catch { /* fail closed: read remains available, mutations stay hidden */ }
  }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminContent}</p><h1>{copy.adminCmsPages}</h1><p className="route-description">{copy.adminCmsEditor}</p></div></header><CmsEditorialList kind="page" data={result.data} copy={copy} unavailable={result.unavailable} query={query} status={status} capabilities={capabilities} /></div>;
}
