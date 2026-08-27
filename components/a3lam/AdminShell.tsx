import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "@/components/a3lam/AdminLogoutButton";
import {
  AdminBreadcrumbs,
  AdminContent,
  AdminFooter,
  AdminHeader,
  AdminNotifications,
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
      <div className="a3lam-shell admin-shell">
        <AdminSidebar
          groups={navigation}
          brand={copy.siteName}
          controlCenter={copy.adminControlCenter}
          unavailableLabel={copy.adminCmsUnavailable}
        />
        <section className="admin-content">
          <AdminHeader title={copy.adminControlCenter} description={copy.adminControlCenterDescription} />
          <AdminBreadcrumbs current={copy.adminControlCenter} homeLabel={copy.adminDashboard} ariaLabel={copy.adminControlCenter} />
          <AdminNotifications />
          <AdminContent>{children}</AdminContent>
          <AdminFooter homeLabel={copy.navHome} logout={<AdminLogoutButton label={copy.adminLogout} />} />
        </section>
      </div>
    </main>
  );
}
