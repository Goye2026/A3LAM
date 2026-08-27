import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages, type FoundationMessages } from "@/lib/i18n/messages";
import { listContentTypes } from "@/lib/cms/contentRegistry";

function contentLabel(definition: ReturnType<typeof listContentTypes>[number], copy: FoundationMessages) {
  return copy[definition.labelKey];
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
  const availableCount = content.filter(({ definition }) => definition.availability === "available").length;
  if (availableCount === 0) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminPeopleGroup}</p><h1>{copy.adminContent}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div>
      </header>
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
