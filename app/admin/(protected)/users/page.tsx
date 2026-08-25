import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminUserManager } from "@/components/a3lam/AdminUserManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Users · A3LAM" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !hasAdminPermission(principal.role, "users.read")) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  const status = params.status === "active" || params.status === "disabled" ? params.status : "";
  let users = [] as Awaited<ReturnType<typeof adminRepository.listAdminUsers>>;
  let unavailable = false;
  try { users = await adminRepository.listAdminUsers({ query: params.q?.trim(), disabled: status }); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminUsers}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}<form className="admin-inline-filter" method="get"><label htmlFor="admin-user-query">{copy.adminSearch}</label><input id="admin-user-query" name="q" defaultValue={params.q ?? ""} /><label htmlFor="admin-user-status">{copy.adminUserStatus}</label><select id="admin-user-status" name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="active">{copy.adminUserActive}</option><option value="disabled">{copy.adminUserDisabled}</option></select><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button></form><AdminUserManager initialItems={users} copy={copy} /></div>;
}
