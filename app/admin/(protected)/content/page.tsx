import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function AdminContentPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let canPeople = false;
  let canCategories = false;
  let canProfiles = false;
  try {
    [canPeople, canCategories, canProfiles] = await Promise.all([
      hasEffectiveAdminPermission(principal, "people.read"),
      hasEffectiveAdminPermission(principal, "categories.read"),
      hasEffectiveAdminPermission(principal, "profiles.read"),
    ]);
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminRequiresSchema}</p></div>;
  }
  if (!canPeople && !canCategories && !canProfiles) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminPeopleGroup}</p><h1>{copy.adminContent}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header><section className="admin-panel admin-link-grid" aria-label={copy.adminContent}>
    {canPeople ? <Link className="admin-action-card" href="/admin/people"><strong>{copy.adminPeople}</strong><span>{copy.adminEdit}</span></Link> : null}
    {canCategories ? <Link className="admin-action-card" href="/admin/categories"><strong>{copy.adminCategories}</strong><span>{copy.adminEdit}</span></Link> : null}
    {canProfiles ? <Link className="admin-action-card" href="/admin/profiles"><strong>{copy.adminProfiles}</strong><span>{copy.adminReviewContent}</span></Link> : null}
  </section></div>;
}
