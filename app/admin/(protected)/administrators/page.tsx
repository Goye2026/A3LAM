import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminIdentityManager } from "@/components/a3lam/AdminIdentityManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Administrators · A3LAM" };

export default async function AdministratorsPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "admins.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let items = [] as Awaited<ReturnType<typeof adminRepository.listAdminIdentities>>;
  let unavailable = false;
  try { items = await adminRepository.listAdminIdentities(); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminAdministrators}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : <AdminIdentityManager initialItems={items} copy={copy} canManage={await hasEffectiveAdminPermission(principal, "admins.manage")} canRevokeSessions={await hasEffectiveAdminPermission(principal, "sessions.revoke")} canAssignSuperAdmin={principal.role === "SUPER_ADMIN"} />}</div>;
}
