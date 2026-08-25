import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AdminUserDetailManager } from "@/components/a3lam/AdminUserDetailManager";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { parseId } from "@/lib/admin/input";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "User detail · A3LAM", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "users.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let item;
  try {
    item = await adminRepository.getAdminUserDetail(parseId((await params).id));
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p></div>;
  }
  if (!item) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminNotFound}</p></div>;
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminUserDetail}</h1><p className="route-description">{item.name}</p></div><Link className="button button-quiet" href="/admin/users">{copy.adminCancel}</Link></header><AdminUserDetailManager initialItem={item} copy={copy} canManage={await hasEffectiveAdminPermission(principal, "users.suspend")} canRevokeSessions={await hasEffectiveAdminPermission(principal, "users.sessions.revoke")} /></div>;
}
