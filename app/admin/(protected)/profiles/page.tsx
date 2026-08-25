import type { Metadata } from "next";
import Link from "next/link";
import { ProfileModerationTable } from "@/components/a3lam/ProfileModerationTable";
import { listAdminProfiles, type ProfileRecord } from "@/lib/user/profileRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";

export const metadata: Metadata = { title: "مراجعة الملفات المهنية", robots: { index: false, follow: false } };

export default async function AdminProfilesPage() {
  const access = await getAdminPageAccess("profiles.read");
  const copy = getMessages(defaultLocale);
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  let profiles: ProfileRecord[] = [];
  let unavailable = false;
  try { profiles = await listAdminProfiles(); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">إدارة الملفات</p><h1>الملفات المهنية</h1><p className="route-description">راجع الملفات المرسلة من المستخدمين قبل إتاحتها للعامة. هذه الشاشة لا تعرض كلمات المرور أو مفاتيح الجلسات.</p></div><Link className="button button-quiet" href="/admin">لوحة الإدارة</Link></header>{unavailable ? <p className="admin-alert" role="alert">تعذر الاتصال بقاعدة البيانات.</p> : <ProfileModerationTable initialProfiles={profiles} copy={copy} />}</div>;
}
