import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/a3lam/AdminLogoutButton";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { effectivePermissionsForPrincipal, type AdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-nav-group">
      <p className="admin-nav-group-label">{label}</p>
      <div className="admin-nav-group-links">{children}</div>
    </div>
  );
}

export async function AdminShell({ children }: { children: ReactNode }) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  let effectivePermissions = new Set<AdminPermission>();
  if (principal) {
    try { effectivePermissions = await effectivePermissionsForPrincipal(principal); } catch { effectivePermissions = new Set<AdminPermission>(); }
  }
  const can = (permission: AdminPermission) => effectivePermissions.has(permission);
  return (
    <main className="a3lam-page admin-page">
      <div className="a3lam-shell admin-shell">
        <aside className="admin-sidebar" aria-label={copy.adminControlCenter}>
          <div className="admin-brand">
            <Link href="/admin" className="brand-lockup">
              <span className="a3lam-brand-mark" aria-hidden="true">أ</span>
              <span>
                <strong>{copy.siteName}</strong>
                <small>{copy.adminControlCenter}</small>
              </span>
            </Link>
          </div>
          <nav className="admin-nav" aria-label={copy.adminControlCenter}>
            <Link href="/admin">{copy.adminDashboard}</Link>
            <NavGroup label={copy.adminPeopleGroup}>
              {can("people.read") ? <Link href="/admin/people">{copy.adminPeople}</Link> : null}
              {can("people.read") ? <Link href="/admin/people/new">{copy.adminAddPerson}</Link> : null}
              {can("categories.read") ? <Link href="/admin/categories">{copy.adminCategories}</Link> : null}
              {can("people.read") ? <Link href="/admin/content">{copy.adminContent}</Link> : null}
            </NavGroup>
            <NavGroup label={copy.adminOperationsGroup}>
              {can("profiles.read") ? <Link href="/admin/profiles">{copy.adminProfiles}</Link> : null}
              {can("users.read") ? <Link href="/admin/users">{copy.adminUsers}</Link> : null}
              {can("admins.read") ? <Link href="/admin/administrators">{copy.adminAdministrators}</Link> : null}
              {can("editors.read") ? <Link href="/admin/editors">{copy.adminEditors}</Link> : null}
              {can("sessions.read") ? <Link href="/admin/sessions">{copy.adminSessions}</Link> : null}
              {can("roles.read") ? <Link href="/admin/roles">{copy.adminPermissionMatrix}</Link> : null}
              {can("permissions.read") ? <Link href="/admin/permissions">{copy.adminPermissionOverrides}</Link> : null}
              {can("audit.read") ? <Link href="/admin/audit">{copy.adminAudit}</Link> : null}
            </NavGroup>
            <NavGroup label={copy.adminProductGroup}>
              {can("homepage.read") ? <Link href="/admin/site">{copy.adminSiteExperienceCenter}</Link> : null}
              {can("homepage.read") ? <Link href="/admin/homepage">{copy.adminHomepage}</Link> : null}
              {can("homepage.read") ? <Link href="/admin/homepage/preview">{copy.adminPreview}</Link> : null}
              {can("appearance.read") ? <Link href="/admin/appearance">{copy.adminAppearance}</Link> : null}
              {can("appearance.read") ? <Link href="/admin/appearance/identity">{copy.adminIdentitySettings}</Link> : null}
              {can("navigation.read") ? <Link href="/admin/appearance/navigation">{copy.adminNavigationManager}</Link> : null}
              {can("footer.read") ? <Link href="/admin/appearance/footer">{copy.adminFooterManager}</Link> : null}
              {can("profile_presentation.read") ? <Link href="/admin/profile-presentation">{copy.adminProfilePresentationSettings}</Link> : null}
              {can("media.read") ? <Link href="/admin/media">{copy.adminMedia}</Link> : null}
              {can("seo.read") ? <Link href="/admin/seo">{copy.adminSeo}</Link> : null}
              {can("settings.read") ? <Link href="/admin/settings">{copy.adminSettings}</Link> : null}
            </NavGroup>
            <NavGroup label={copy.adminSystemGroup}>
              {can("system.read") ? <Link href="/admin/system">{copy.adminSystem}</Link> : null}
            </NavGroup>
          </nav>
          <div className="admin-sidebar-footer">
            <Link href="/">{copy.navHome}</Link>
            <AdminLogoutButton label={copy.adminLogout} />
          </div>
        </aside>
        <section className="admin-content">{children}</section>
      </div>
    </main>
  );
}
