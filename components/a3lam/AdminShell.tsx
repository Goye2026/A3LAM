import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/a3lam/AdminLogoutButton";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function AdminShell({ children }: { children: ReactNode }) {
  const copy = getMessages(defaultLocale);
  return (
    <main className="a3lam-page admin-page">
      <div className="a3lam-shell admin-shell">
        <aside className="admin-sidebar" aria-label={copy.adminTitle}>
          <div className="admin-brand">
            <Link href="/admin" className="brand-lockup">
              <span className="brand-mark" aria-hidden="true">أ</span>
              <span>
                <strong>{copy.siteName}</strong>
                <small>{copy.adminTitle}</small>
              </span>
            </Link>
          </div>
          <nav className="admin-nav" aria-label={copy.adminTitle}>
            <Link href="/admin">{copy.adminDashboard}</Link>
            <Link href="/admin/people">{copy.adminPeople}</Link>
            <Link href="/admin/people/new">{copy.adminAddPerson}</Link>
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
