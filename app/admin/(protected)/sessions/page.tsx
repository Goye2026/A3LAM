import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminSessionManager } from "@/components/a3lam/AdminSessionManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Sessions · A3LAM", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ status?: string; adminId?: string }> };

export default async function SessionsPage({ searchParams }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "sessions.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  const status = ["active", "revoked", "expired", "all"].includes(params.status ?? "") ? params.status as "active" | "revoked" | "expired" | "all" : "active";
  let items = [] as Awaited<ReturnType<typeof adminRepository.listAdminSessions>>;
  let unavailable = false;
  try { items = await adminRepository.listAdminSessions({ status, adminId: params.adminId?.trim() || undefined }); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminSessions}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header><form className="admin-inline-filter" method="get"><label htmlFor="admin-session-status">{copy.adminSessionStatus}<select id="admin-session-status" name="status" defaultValue={status}><option value="active">{copy.adminSessionActive}</option><option value="revoked">{copy.adminSessionRevoked}</option><option value="expired">{copy.adminSessionExpired}</option><option value="all">{copy.adminAllSessions}</option></select></label><label htmlFor="admin-session-owner">{copy.adminIdentityName}<input id="admin-session-owner" name="adminId" dir="ltr" defaultValue={params.adminId ?? ""} /></label><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button></form>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : <AdminSessionManager initialItems={items} copy={copy} canRevoke={await hasEffectiveAdminPermission(principal, "sessions.revoke")} currentSessionId={principal.sessionId} />}</div>;
}
