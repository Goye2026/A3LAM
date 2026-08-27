import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages, type FoundationMessages } from "@/lib/i18n/messages";
import { listContentTypes } from "@/lib/cms/contentRegistry";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import type { CmsWorkspaceSummary } from "@/lib/cms/editorialTypes";

function contentLabel(definition: ReturnType<typeof listContentTypes>[number], copy: FoundationMessages) {
  return copy[definition.labelKey];
}

async function loadWorkspaceSummary(): Promise<CmsWorkspaceSummary | null> {
  try { return await editorialRepository.getWorkspaceSummary(); } catch { return null; }
}

export default async function AdminContentPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;

  let access: boolean[];
  try {
    access = await Promise.all(listContentTypes().map((definition) => definition.readPermission ? hasEffectiveAdminPermission(principal, definition.readPermission) : Promise.resolve(false)));
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminRequiresSchema}</p></div>;
  }

  const content = listContentTypes().map((definition, index) => ({ definition, allowed: access[index] ?? false })).filter(({ definition, allowed }) => definition.availability !== "available" || allowed);
  const summary = await loadWorkspaceSummary();
  const availableCount = content.filter(({ definition }) => definition.availability === "available").length;
  if (availableCount === 0) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminPeopleGroup}</p><h1>{copy.adminContent}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div>
      </header>
      <section className="admin-panel cms-workspace-summary" aria-labelledby="cms-workspace-summary-title"><div className="admin-section-heading"><h2 id="cms-workspace-summary-title">{copy.adminCmsWorkspaceSummary}</h2></div>{summary ? <div className="cms-workspace-summary-grid"><article><h3>{copy.adminCmsPages}</h3><strong>{summary.page.total}</strong><span>{copy.adminCmsDraftCount}: {summary.page.draft} · {copy.adminCmsReviewCount}: {summary.page.review} · {copy.adminCmsPublishedCount}: {summary.page.published} · {copy.adminCmsTrashedCount}: {summary.page.trashed}</span></article><article><h3>{copy.adminCmsPosts}</h3><strong>{summary.post.total}</strong><span>{copy.adminCmsDraftCount}: {summary.post.draft} · {copy.adminCmsReviewCount}: {summary.post.review} · {copy.adminCmsPublishedCount}: {summary.post.published} · {copy.adminCmsTrashedCount}: {summary.post.trashed}</span></article></div> : <p className="admin-field-hint">{copy.adminCmsRequiresMigration}</p>}</section>
      <section className="admin-panel admin-content-type-grid" aria-labelledby="admin-content-types-title">
        <div className="admin-section-heading"><h2 id="admin-content-types-title">{copy.adminContent}</h2><span className="admin-muted">{availableCount}</span></div>
        <div className="admin-link-grid">
          {content.map(({ definition }) => {
            const label = contentLabel(definition, copy);
            const available = definition.availability === "available" && Boolean(definition.routeBase);
            const description = available ? (definition.domainSpecific ? copy.adminReadOnly : copy.adminEdit) : copy.adminCmsUnavailable;
            const status = available ? copy.adminAvailable : copy.adminUnavailable;
            const body = <><strong>{label}</strong><span>{description}</span><small className={available ? "admin-content-type-status is-available" : "admin-content-type-status"}>{status}</small></>;
            return available ? <Link className="admin-action-card" href={definition.routeBase!} key={definition.id}>{body}</Link> : <div className="admin-action-card is-disabled" aria-disabled="true" key={definition.id}>{body}</div>;
          })}
        </div>
      </section>
    </div>
  );
}
