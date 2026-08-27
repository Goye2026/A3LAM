import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "@/components/a3lam/AdminLogoutButton";
import {
  AdminBreadcrumbs,
  AdminContent,
  AdminFooter,
  AdminHeader,
  AdminNotifications,
  AdminTopBar,
} from "@/components/a3lam/AdminDesignSystem";
import { AdminSidebar } from "@/components/a3lam/AdminSidebar";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { effectivePermissionsForPrincipal, type AdminPermission } from "@/lib/admin/rbac";
import { getAdminNavigation, filterAdminNavigation } from "@/lib/cms/adminNavigation";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export async function AdminShell({ children }: { children: ReactNode }) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  let effectivePermissions = new Set<AdminPermission>();
  if (principal) {
    try {
      effectivePermissions = await effectivePermissionsForPrincipal(principal);
    } catch {
      effectivePermissions = new Set<AdminPermission>();
    }
  }
  const can = (permission: AdminPermission) => effectivePermissions.has(permission);
  const navigation = filterAdminNavigation(getAdminNavigation(copy), can);

  return (
    <main className="a3lam-page admin-page">
      <a className="admin-skip-link" href="#admin-main">{copy.adminSkipToContent}</a>
      <div className="a3lam-shell admin-shell">
        <AdminSidebar
          groups={navigation}
          brand={copy.siteName}
          controlCenter={copy.adminControlCenter}
          navigationLabel={copy.adminNavigationLabel}
          unavailableLabel={copy.adminCmsUnavailable}
          openLabel={copy.menuLabel}
          closeLabel={copy.closeMenu}
        />
        <section id="admin-main" className="admin-content" aria-label={copy.adminControlCenter}>
          <AdminTopBar label={copy.adminIdentityName} value={principal?.displayName ?? "—"} action={<AdminLogoutButton label={copy.adminLogout} />} />
          <AdminHeader brand={copy.siteName} title={copy.adminControlCenter} description={copy.adminControlCenterDescription} statusLabel={copy.adminControlCenter} />
          <AdminBreadcrumbs current={copy.adminControlCenter} homeLabel={copy.adminDashboard} ariaLabel={copy.adminControlCenter} />
          <AdminNotifications />
          <AdminContent>{children}</AdminContent>
          <AdminFooter homeLabel={copy.navHome} logout={null} />
        </section>
      </div>
    </main>
  );
}
