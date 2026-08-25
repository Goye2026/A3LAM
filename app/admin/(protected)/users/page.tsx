import { AdminFoundationPanel } from "@/components/a3lam/AdminFoundationPanel";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";

function labelProfileStatus(value: string, copy: ReturnType<typeof getMessages>) {
  if (value === "published") return copy.adminPublished;
  if (value === "pending_review") return copy.adminReview;
  if (value === "archived") return copy.adminArchived;
  return copy.adminDraft;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const copy = getMessages(defaultLocale);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const profileFilterStatus = params.status && ["draft", "pending_review", "published", "archived"].includes(params.status) ? params.status as "draft" | "pending_review" | "published" | "archived" : "";
  let users: Awaited<ReturnType<typeof adminRepository.listUserSummaries>> = [];
  let unavailable = false;
  try {
    users = await adminRepository.listUserSummaries({ query, profileStatus: profileFilterStatus });
  } catch {
    unavailable = true;
  }
  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminUsers}</h1><p className="route-description">ملخصات حسابات المستخدمين والملفات المرتبطة بها، دون عرض بيانات المصادقة الخاصة.</p></div>
      </header>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      <AdminFoundationPanel eyebrow={copy.adminUsers} title={copy.adminReadOnly} description="تُعرض أسماء الحسابات وملخص حالة الملف المهني فقط. إدارة التعليق والجلسات تحتاج بنية هوية وصلاحيات إضافية." status={copy.adminReadOnly} />
      <section className="admin-panel" aria-labelledby="admin-users-list-title">
        <div className="admin-section-heading"><h2 id="admin-users-list-title">{copy.adminUsers}</h2><span className="admin-count">{users.length}</span></div>
        <form className="admin-inline-filter" method="get"><label htmlFor="admin-user-query">{copy.adminSearch}</label><input id="admin-user-query" name="q" defaultValue={query} placeholder="ابحث بالاسم" /><label htmlFor="admin-user-status">{copy.adminFilterStatus}</label><select id="admin-user-status" name="status" defaultValue={profileFilterStatus}><option value="">{copy.adminAllStatuses}</option><option value="draft">{copy.adminDraft}</option><option value="pending_review">{copy.adminReview}</option><option value="published">{copy.adminPublished}</option><option value="archived">{copy.adminArchived}</option></select><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button></form>
        {!users.length ? <p className="admin-empty">{copy.adminNoUsers}</p> : <div className="admin-user-table" role="table" aria-label={copy.adminUsers}><div className="admin-user-table-row admin-user-table-head" role="row"><span>الحساب</span><span>{copy.adminProfiles}</span><span>{copy.adminUpdated}</span></div>{users.map((user) => <div className="admin-user-table-row" role="row" key={user.id}><span><strong>{user.name}</strong><small dir="ltr">{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(user.createdAt))}</small></span><span>{user.profile ? <><strong>{user.profile.nameArabic}</strong><small>{labelProfileStatus(user.profile.status, copy)} · {user.profile.visibility}</small></> : <small>—</small>}</span><span>{user.lastSignedIn ? new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(user.lastSignedIn)) : "—"}</span></div>)}</div>}
      </section>
    </div>
  );
}
