import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminSessionManager } from "@/components/a3lam/AdminSessionManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Sessions · A3LAM" };

export default async function SessionsPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !hasAdminPermission(principal.role, "admins.read")) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let items = [] as Awaited<ReturnType<typeof adminRepository.listAdminSessions>>;
  let unavailable = false;
  try { items = await adminRepository.listAdminSessions(); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminSessions}</h1><p className="route-description">{copy.adminIdentityRequiresActivation}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : <AdminSessionManager initialItems={items} copy={copy} />}</div>;
}
