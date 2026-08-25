import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminUserManager } from "@/components/a3lam/AdminUserManager";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { pageCount, parsePositivePage } from "@/lib/admin/pagination";

export const metadata: Metadata = { title: "Users · A3LAM", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ q?: string; status?: string; profileStatus?: string; visibility?: string; hasProfile?: string; page?: string; sort?: string }> };

function pageHref(params: { q?: string; status: string; profileStatus: string; visibility: string; hasProfile: string; sort: string }, page: number) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.profileStatus) query.set("profileStatus", params.profileStatus);
  if (params.visibility) query.set("visibility", params.visibility);
  if (params.hasProfile) query.set("hasProfile", params.hasProfile);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", String(page));
  return `/admin/users?${query.toString()}`;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "users.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  const status = params.status === "active" || params.status === "disabled" ? params.status : "";
  const profileStatus = ["draft", "pending_review", "published", "archived"].includes(params.profileStatus ?? "") ? params.profileStatus as "draft" | "pending_review" | "published" | "archived" : "";
  const visibility = ["private", "unlisted", "published"].includes(params.visibility ?? "") ? params.visibility as "private" | "unlisted" | "published" : "";
  const hasProfile = params.hasProfile === "yes" || params.hasProfile === "no" ? params.hasProfile : "";
  const sort = ["created_desc", "created_asc", "name", "last_signed_in_desc"].includes(params.sort ?? "") ? params.sort as "created_desc" | "created_asc" | "name" | "last_signed_in_desc" : "created_desc";
  const page = parsePositivePage(params.page);
  let users: Awaited<ReturnType<typeof adminRepository.listAdminUsers>> | null = null;
  let unavailable = false;
  try { users = await adminRepository.listAdminUsers({ query: params.q?.trim(), disabled: status, profileStatus, visibility, hasProfile, page, pageSize: 20, sort }); } catch { unavailable = true; }
  const filterParams = { q: params.q?.trim(), status, profileStatus, visibility, hasProfile, sort };
  const pageInfo = users ? { page: users.page, pageCount: pageCount(users.total, users.pageSize), total: users.total, pageSize: users.pageSize, previousHref: users.page > 1 ? pageHref(filterParams, users.page - 1) : undefined, nextHref: users.page < pageCount(users.total, users.pageSize) ? pageHref(filterParams, users.page + 1) : undefined } : undefined;
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminUsers}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}<form className="admin-inline-filter admin-filter-grid" method="get"><label htmlFor="admin-user-query">{copy.adminSearch}<input id="admin-user-query" name="q" defaultValue={params.q ?? ""} /></label><label htmlFor="admin-user-status">{copy.adminUserStatus}<select id="admin-user-status" name="status" defaultValue={status}><option value="">{copy.adminAllStatuses}</option><option value="active">{copy.adminUserActive}</option><option value="disabled">{copy.adminUserDisabled}</option></select></label><label htmlFor="admin-profile-status">{copy.adminProfileStatus}<select id="admin-profile-status" name="profileStatus" defaultValue={profileStatus}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="pending_review">{copy.adminReview}</option><option value="published">{copy.adminPublished}</option><option value="archived">{copy.adminArchived}</option></select></label><label htmlFor="admin-profile-visibility">{copy.adminVisibility}<select id="admin-profile-visibility" name="visibility" defaultValue={visibility}><option value="">{copy.adminAllStatuses}</option><option value="private">{copy.adminVisibilityPrivate}</option><option value="unlisted">{copy.adminVisibilityUnlisted}</option><option value="published">{copy.adminVisibilityPublished}</option></select></label><label htmlFor="admin-has-profile">{copy.adminHasProfile}<select id="admin-has-profile" name="hasProfile" defaultValue={hasProfile}><option value="">{copy.adminAllStatuses}</option><option value="yes">{copy.adminWithProfile}</option><option value="no">{copy.adminWithoutProfile}</option></select></label><label htmlFor="admin-user-sort">{copy.adminSort}<select id="admin-user-sort" name="sort" defaultValue={sort}><option value="created_desc">{copy.adminSortNewest}</option><option value="created_asc">{copy.adminSortOldest}</option><option value="name">{copy.adminSortName}</option><option value="last_signed_in_desc">{copy.adminUpdated}</option></select></label><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button></form>{!unavailable && users ? <AdminUserManager initialItems={users.items} copy={copy} canManage={await hasEffectiveAdminPermission(principal, "users.suspend")} canRevokeSessions={await hasEffectiveAdminPermission(principal, "users.sessions.revoke")} pageInfo={pageInfo} /> : null}</div>;
}
