import { cookies } from "next/headers";
import type { Metadata } from "next";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { ADMIN_PERMISSIONS, ADMIN_ROLES, hasAdminPermission, permissionsForRole } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Permissions · A3LAM" };

export default async function RolesPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !hasAdminPermission(principal.role, "roles.read")) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminSystemGroup}</p><h1>{copy.adminPermissionMatrix}</h1><p className="route-description">{copy.adminPermissionMatrixDescription}</p></div></header><section className="admin-panel" aria-labelledby="permission-matrix-title"><h2 id="permission-matrix-title">{copy.adminPermissionMatrix}</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{copy.adminPermissionRole}</th>{ADMIN_PERMISSIONS.map((permission) => <th key={permission} dir="ltr">{permission}</th>)}</tr></thead><tbody>{ADMIN_ROLES.filter((role) => role !== "USER").map((role) => { const permissions = permissionsForRole(role); return <tr key={role}><th>{role}</th>{ADMIN_PERMISSIONS.map((permission) => <td key={permission} aria-label={`${role}: ${permission}`}>{permissions.has(permission) ? "✓" : "—"}</td>)}</tr>; })}</tbody></table></div></section></div>;
}
