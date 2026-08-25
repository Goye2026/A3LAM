import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminPermissionManager } from "@/components/a3lam/AdminPermissionManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { ADMIN_PERMISSIONS, ADMIN_ROLES, hasEffectiveAdminPermission, permissionsForRole } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Permissions · A3LAM", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ adminId?: string }> };

export default async function PermissionsPage({ searchParams }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "permissions.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  let identities = [] as Awaited<ReturnType<typeof adminRepository.listAdminIdentities>>;
  let initialItem = null as Awaited<ReturnType<typeof adminRepository.getAdminEffectivePermissions>>;
  let unavailable = false;
  try {
    identities = await adminRepository.listAdminIdentities();
    const selectedId = params.adminId ?? identities[0]?.id;
    if (selectedId) initialItem = await adminRepository.getAdminEffectivePermissions(selectedId);
  } catch { unavailable = true; }
  const canEdit = principal.role === "SUPER_ADMIN" && await hasEffectiveAdminPermission(principal, "permissions.assign");
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminSystemGroup}</p><h1>{copy.adminPermissionOverrides}</h1><p className="route-description">{copy.adminPermissionMatrixDescription}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminPermissionConfiguration}</p> : null}<section className="admin-panel" aria-labelledby="permission-defaults-title"><h2 id="permission-defaults-title">{copy.adminPermissionMatrix}</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{copy.adminPermissionRole}</th>{ADMIN_PERMISSIONS.map((permission) => <th key={permission} dir="ltr">{permission}</th>)}</tr></thead><tbody>{ADMIN_ROLES.filter((role) => role !== "USER").map((role) => <tr key={role}><th>{role}</th>{ADMIN_PERMISSIONS.map((permission) => <td key={permission}>{permissionsForRole(role).has(permission) ? "✓" : "—"}</td>)}</tr>)}</tbody></table></div></section>{unavailable ? null : <AdminPermissionManager identities={identities} permissions={[...ADMIN_PERMISSIONS]} initialItem={initialItem} copy={copy} canEdit={canEdit} />}</div>;
}
