import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

const resources = [
  { href: "/admin/site/homepage", title: "adminHomepageBuilder", detail: "adminHomepage", permission: "homepage.read" },
  { href: "/admin/site/identity", title: "adminIdentitySettings", detail: "adminSiteName", permission: "appearance.read" },
  { href: "/admin/site/appearance", title: "adminThemeSettings", detail: "adminAppearance", permission: "appearance.read" },
  { href: "/admin/site/navigation", title: "adminNavigationManager", detail: "adminNavigationManager", permission: "navigation.read" },
  { href: "/admin/site/footer", title: "adminFooterManager", detail: "adminFooterManager", permission: "footer.read" },
  { href: "/admin/site/seo", title: "adminSeoManager", detail: "adminSeo", permission: "seo.read" },
  { href: "/admin/site/profile-presentation", title: "adminProfilePresentationSettings", detail: "adminProfiles", permission: "profile_presentation.read" },
  { href: "/admin/site/settings", title: "adminSettings", detail: "adminSettings", permission: "settings.read" },
] as const;

type CopyKey = keyof ReturnType<typeof getMessages>;

export default async function AdminSitePage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const visible = [] as typeof resources[number][];
  try {
    for (const resource of resources) if (await hasEffectiveAdminPermission(principal, resource.permission)) visible.push(resource);
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminRequiresSchema}</p></div>;
  }
  return <div className="admin-route">
    <header className="admin-route-heading"><div><p className="eyebrow">{copy.adminProductGroup}</p><h1>{copy.adminSiteExperienceCenter}</h1><p className="route-description">{copy.adminSiteExperienceCenterDescription}</p></div></header>
    {visible.length === 0 ? <p className="admin-empty">{copy.adminReadOnly}</p> : <section className="admin-action-grid" aria-label={copy.adminSiteExperienceCenter}>{visible.map((resource) => <Link className="admin-action-card" href={resource.href} key={resource.href}><strong>{copy[resource.title as CopyKey]}</strong><span>{copy[resource.detail as CopyKey]}</span></Link>)}</section>}
  </div>;
}
