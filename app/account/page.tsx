import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user/auth";
import { getProfileForUser } from "@/lib/user/profileRepository";
import { LogoutButton } from "@/components/a3lam/LogoutButton";

export const metadata: Metadata = {
  title: "حسابي",
  description: "إدارة حسابك وملفك المهني في أعلام.",
  robots: { index: false, follow: false },
};

const statusLabels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;
const visibilityLabels = { private: "خاص", unlisted: "غير مدرج", published: "عام" } as const;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const profile = await getProfileForUser(user.id);

  return (
    <main className="account-page" dir="rtl">
      <div className="account-shell">
        <header className="account-header">
          <div>
            <p className="eyebrow">المساحة الشخصية</p>
            <h1>مرحبًا، {user.name}</h1>
            <p className="route-description">هذه المساحة لإدارة ملفك المهني، ولا تمنح صلاحيات تحرير المحتوى التحريري في أعلام.</p>
          </div>
          <LogoutButton label="تسجيل الخروج" busyLabel="جارٍ الخروج…" />
        </header>
        <section className="account-panel" aria-labelledby="profile-status-title">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">الملف المهني</p>
              <h2 id="profile-status-title">ملفك في أعلام</h2>
            </div>
            <Link className="button button-primary" href="/account/profile">{profile ? "تعديل الملف" : "إنشاء الملف"}</Link>
          </div>
          {profile ? (
            <div className="account-status-grid">
              <div><span>الاسم</span><strong>{profile.profile.nameArabic}</strong></div>
              <div><span>الحالة</span><strong>{statusLabels[profile.profile.status]}</strong></div>
              <div><span>الظهور</span><strong>{visibilityLabels[profile.profile.visibility]}</strong></div>
              <div><span>آخر تحديث</span><strong>{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(profile.profile.updatedAt))}</strong></div>
            </div>
          ) : (
            <div className="empty-state"><h3>لم تنشئ ملفك بعد</h3><p>ابدأ بإضافة معلوماتك المهنية، ثم احفظها كمسودة قبل إرسالها للمراجعة.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
