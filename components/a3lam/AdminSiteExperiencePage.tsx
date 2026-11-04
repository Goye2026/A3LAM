import { cookies } from "next/headers";
import { AdminSiteExperienceEditor } from "@/components/a3lam/AdminSiteExperienceEditor";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages, type FoundationMessages } from "@/lib/i18n/messages";
import { siteExperienceAccess } from "@/lib/site-experience/access";
import type { SiteExperienceResource } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";
import { adminRepository } from "@/lib/data/adminRepository";

export type SiteExperienceDirectoryOptions = { categories: { id: string; name: string; slug: string }[]; people: { id: string; nameArabic: string; slug: string }[] };

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
  let directoryOptions: SiteExperienceDirectoryOptions = { categories: [], people: [] };
  try {
    item = await siteExperienceRepository.getAdminResource(resource);
  } catch {
    unavailable = true;
  }
  if (!unavailable && (resource === "homepage" || resource === "navigation" || resource === "footer")) {
    try {
      const [categories, people] = await Promise.all([adminRepository.listCategoryOptions(), adminRepository.listPeople({ status: "published", pageSize: 100, sort: "name" })]);
      directoryOptions = { categories: categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug })), people: people.items.map((person) => ({ id: person.id, nameArabic: person.nameArabic, slug: person.slug })) };
    } catch {
      directoryOptions = { categories: [], people: [] };
    }
  }
  return <AdminSiteExperienceEditor resource={resource} title={title} copy={copy} initial={item} unavailable={unavailable} canEdit={canEdit} canPublish={canPublish} directoryOptions={directoryOptions} />;
}

export type AdminSiteExperienceCopy = FoundationMessages;
