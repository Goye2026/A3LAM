import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminIdentityManager } from "@/components/a3lam/AdminIdentityManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Editors · A3LAM" };

export default async function EditorsPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !hasAdminPermission(principal.role, "editors.read")) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let items = [] as Awaited<ReturnType<typeof adminRepository.listAdminIdentities>>;
  let unavailable = false;
  try { items = await adminRepository.listAdminIdentities({ role: "EDITOR" }); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminEditors}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : <AdminIdentityManager initialItems={items} copy={copy} editorsOnly canManage={hasAdminPermission(principal.role, "editors.manage")} />}</div>;
}
