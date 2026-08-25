import { cookies } from "next/headers";
import { AdminSiteExperienceEditor } from "@/components/a3lam/AdminSiteExperienceEditor";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages, type FoundationMessages } from "@/lib/i18n/messages";
import { siteExperienceAccess } from "@/lib/site-experience/access";
import type { SiteExperienceResource } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

export async function AdminSiteExperiencePage({ resource, title }: { resource: SiteExperienceResource; title: string }) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let canRead = false;
  let canEdit = false;
  let canPublish = false;
  try {
    canRead = await hasEffectiveAdminPermission(principal, siteExperienceAccess[resource].read);
    canEdit = await hasEffectiveAdminPermission(principal, siteExperienceAccess[resource].update);
    canPublish = await hasEffectiveAdminPermission(principal, siteExperienceAccess[resource].publish);
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminRequiresSchema}</p></div>;
  }
  if (!canRead) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let item: Awaited<ReturnType<typeof siteExperienceRepository.getAdminResource>> | null = null;
  let unavailable = false;
  try {
    item = await siteExperienceRepository.getAdminResource(resource);
  } catch {
    unavailable = true;
  }
  return <AdminSiteExperienceEditor resource={resource} title={title} copy={copy} initial={item} unavailable={unavailable} canEdit={canEdit} canPublish={canPublish} />;
}

export type AdminSiteExperienceCopy = FoundationMessages;
