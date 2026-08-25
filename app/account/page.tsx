import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user/auth";
import { calculateProfileCompletion, getProfileForUser } from "@/lib/user/profileRepository";
import { LogoutButton } from "@/components/a3lam/LogoutButton";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "حسابي",
  description: "إدارة حسابك وملفك المهني في أعلام.",
  robots: { index: false, follow: false },
};

const statusLabels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;
const visibilityLabels = { private: "خاص", unlisted: "غير مدرج", published: "عام" } as const;

type AccountPageProps = { searchParams?: Promise<{ welcome?: string }> };

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const profile = await getProfileForUser(user.id);
  const completion = calculateProfileCompletion(profile);
  const copy = getMessages(defaultLocale);
  const params = searchParams ? await searchParams : {};
  const updatedAt = profile ? new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(profile.profile.updatedAt)) : null;

  return (
    <main className="account-page" dir="rtl">
      <div className="account-shell">
        <header className="account-header">
          <div><p className="eyebrow">المساحة الشخصية</p><h1>مرحبًا، {user.name}</h1><p className="route-description">إدارة ملفك المهني هنا مستقلة عن مساحة التحرير، ولا تمنحك صلاحيات تعديل الموسوعة.</p></div>
          <LogoutButton label={copy.navLogout} busyLabel={copy.editorSaving} />
        </header>
        {params.welcome === "1" ? <section className="account-welcome" aria-labelledby="welcome-title"><div><p className="eyebrow">A3LAM / الخطوة التالية</p><h2 id="welcome-title">{copy.accountWelcomeTitle}</h2><p>{copy.accountWelcomeDescription}</p></div><Link className="button button-primary" href="/account/profile">ابدأ إنشاء سيرتك</Link></section> : null}
        <section className="account-panel account-dashboard-card" aria-labelledby="profile-status-title">
          <div className="section-heading-row"><div><p className="eyebrow">لوحة الملف</p><h2 id="profile-status-title">ملفك في أعلام</h2></div><div className="account-primary-actions"><Link className="button button-primary" href="/account/profile">{profile ? "تعديل الملف" : "إنشاء الملف"}</Link>{profile ? <Link className="button button-quiet" href="/account/profile/preview">معاينة</Link> : null}</div></div>
          {profile ? <>
            <div className="account-profile-summary"><div><span>الاسم</span><strong>{profile.profile.nameArabic}</strong>{profile.profile.professionalTitle ? <small>{profile.profile.professionalTitle}</small> : null}</div><div><span>الحالة</span><strong className={`status-text status-text-${profile.profile.status}`}>{statusLabels[profile.profile.status]}</strong></div><div><span>الظهور</span><strong>{visibilityLabels[profile.profile.visibility]}</strong><small>{profile.profile.visibility === "published" ? copy.visibilityPublicHint : profile.profile.visibility === "unlisted" ? copy.visibilityUnlistedHint : copy.visibilityPrivateHint}</small></div><div><span>آخر تعديل</span><strong>{updatedAt}</strong></div></div>
            <div className="completion-panel" aria-labelledby="completion-title"><div className="completion-heading"><div><p className="eyebrow">إرشاد</p><h3 id="completion-title">اكتمال الملف</h3></div><strong aria-label={`اكتمال الملف ${completion.percent} بالمئة`}>{completion.percent}%</strong></div><div className="completion-track" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${completion.percent}%` }} /></div><div className="completion-lists"><div><span className="completion-list-title">مكتمل</span>{completion.completed.length > 0 ? <ul>{completion.completed.map((item) => <li key={item}>✓ {item}</li>)}</ul> : <p>ابدأ بالمعلومات الأساسية.</p>}</div><div><span className="completion-list-title">يمكن استكماله</span>{completion.remaining.length > 0 ? <ul>{completion.remaining.slice(0, 4).map((item) => <li key={item}>＋ {item}</li>)}</ul> : <p>الملف مستكمل إرشاديًا.</p>}</div></div><p className="section-help">النسبة إرشادية ولا تستبدل متطلبات المراجعة والنشر التحريري.</p></div>
          </> : <div className="empty-state"><h3>لم تنشئ ملفك بعد</h3><p>ابدأ بإضافة معلوماتك المهنية، ثم احفظها كمسودة قبل إرسالها للمراجعة.</p><Link className="button button-primary" href="/profile/new">إنشاء الملف المهني</Link></div>}
        </section>
      </div>
    </main>
  );
}
