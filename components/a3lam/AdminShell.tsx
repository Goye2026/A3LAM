import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/a3lam/AdminLogoutButton";
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

export function AdminShell({ children }: { children: ReactNode }) {
  const copy = getMessages(defaultLocale);
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
              <Link href="/admin/people">{copy.adminPeople}</Link>
              <Link href="/admin/people/new">{copy.adminAddPerson}</Link>
              <Link href="/admin/categories">{copy.adminCategories}</Link>
              <Link href="/admin/content">{copy.adminContent}</Link>
            </NavGroup>
            <NavGroup label={copy.adminOperationsGroup}>
              <Link href="/admin/profiles">{copy.adminProfiles}</Link>
              <Link href="/admin/users">{copy.adminUsers}</Link>
              <Link href="/admin/administrators">{copy.adminAdministrators}</Link>
              <Link href="/admin/editors">{copy.adminEditors}</Link>
              <Link href="/admin/sessions">{copy.adminSessions}</Link>
              <Link href="/admin/roles">{copy.adminPermissionMatrix}</Link>
              <Link href="/admin/permissions">{copy.adminPermissionOverrides}</Link>
              <Link href="/admin/audit">{copy.adminAudit}</Link>
            </NavGroup>
            <NavGroup label={copy.adminProductGroup}>
              <Link href="/admin/homepage">{copy.adminHomepage}</Link>
              <Link href="/admin/appearance">{copy.adminAppearance}</Link>
              <Link href="/admin/media">{copy.adminMedia}</Link>
              <Link href="/admin/seo">{copy.adminSeo}</Link>
              <Link href="/admin/settings">{copy.adminSettings}</Link>
            </NavGroup>
            <NavGroup label={copy.adminSystemGroup}>
              <Link href="/admin/system">{copy.adminSystem}</Link>
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
