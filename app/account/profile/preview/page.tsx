import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user/auth";
import { getProfileForUser, type ProfileRecord } from "@/lib/user/profileRepository";
import { PersonPortrait } from "@/components/a3lam/PersonPortrait";
import { BiographyContent } from "@/components/a3lam/BiographyContent";
import { ProfileActions } from "@/components/a3lam/ProfileActions";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "معاينة الملف المهني", robots: { index: false, follow: false } };

const statusLabels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;

export default async function ProfilePreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile/preview");
  const record = await getProfileForUser(user.id);
  if (!record) notFound();
  return <PreviewContent record={record} />;
}

function PreviewContent({ record }: { record: ProfileRecord }) {
  const copy = getMessages(defaultLocale);
  const { profile, categories, source, skills, experiences, educations, certifications, languages, portfolio, socialLinks, files } = record;
  const location = [profile.city, profile.country].filter(Boolean).join("، ");
  return (
    <main className="account-page" dir="rtl">
      <div className="account-shell profile-preview-shell">
        <div className="preview-notice" role="status">
          <strong>معاينة خاصة — لا تظهر للعامة</strong>
          <span>الحالة الحالية: {statusLabels[profile.status]}. هذه الصفحة لا تحتوي على structured data أو فهرسة.</span>
        </div>
        <div className="profile-preview">
          <div className="profile-preview-header">
            <div>
              <p className="eyebrow">الإسقاط المهني</p>
              <h1>{profile.nameArabic || "اسمك المهني"}</h1>
              <p className="profile-latin-name">{profile.name || "الاسم اللاتيني"}</p>
              <p className="profile-role">{profile.professionalTitle || "المسمى المهني"}</p>
              {location ? <p className="profile-meta">{location}</p> : null}
              <div className="profile-category-links">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
            </div>
            <PersonPortrait className="profile-avatar" src={profile.imageUrl} alt={profile.nameArabic || "معاينة الصورة"} initials={(profile.nameArabic || "أع").slice(0, 2)} tone="teal" />
          </div>
          <ProfileActions title={profile.nameArabic || "ملف مهني"} copy={copy} />
          <section className="profile-section" aria-labelledby="preview-overview">
            <p className="eyebrow">نبذة مهنية</p>
            <h2 id="preview-overview">{profile.professionalTitle || "التعريف المهني"}</h2>
            {profile.professionalSummary || profile.biography ? <BiographyContent value={profile.professionalSummary || profile.biography} /> : <p className="empty-state">أضف نبذة لتظهر هنا.</p>}
          </section>
          {experiences.length > 0 ? <PreviewList title="الخبرات" id="preview-experience">{experiences.map((item) => <li key={item.id}><strong>{item.jobTitle}</strong><span>{item.organization}{item.location ? ` · ${item.location}` : ""}</span><small>{item.startDate || ""}{item.startDate || item.endDate || item.isCurrent ? " — " : ""}{item.isCurrent ? "حتى الآن" : item.endDate || ""}</small>{item.description ? <p>{item.description}</p> : null}</li>)}</PreviewList> : null}
          {educations.length > 0 ? <PreviewList title="التعليم" id="preview-education">{educations.map((item) => <li key={item.id}><strong>{item.institution}</strong><span>{[item.degree, item.field].filter(Boolean).join(" · ")}</span><small>{item.startDate || ""}{item.startDate || item.endDate ? " — " : ""}{item.endDate || ""}</small>{item.description ? <p>{item.description}</p> : null}</li>)}</PreviewList> : null}
          {skills.length > 0 ? <section className="profile-section"><p className="eyebrow">المهارات</p><h2>مجالات الخبرة</h2><div className="skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section> : null}
          {certifications.length > 0 ? <PreviewList title="الشهادات المهنية" id="preview-certifications">{certifications.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.issuer}</span><small>{item.obtainedDate || ""}</small></li>)}</PreviewList> : null}
          {languages.length > 0 ? <PreviewList title="اللغات" id="preview-languages">{languages.map((item) => <li key={item.id}><strong>{item.language}</strong><span>{item.proficiency}</span></li>)}</PreviewList> : null}
          {portfolio.length > 0 ? <PreviewList title="الأعمال والمشاريع" id="preview-portfolio">{portfolio.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.description}</span>{item.url ? <small dir="ltr">{item.url}</small> : null}</li>)}</PreviewList> : null}
          {socialLinks.length > 0 ? <PreviewList title="الروابط المهنية" id="preview-social">{socialLinks.map((item) => <li key={item.id}><strong>{item.platform}</strong><small dir="ltr">{item.url}</small></li>)}</PreviewList> : null}
          <section className="profile-section preview-private-section" aria-labelledby="preview-privacy">
            <p className="eyebrow">الاتصال والخصوصية</p>
            <h2 id="preview-privacy">ما سيظهر للعامة</h2>
            <p>{profile.contactEmail ? `البريد: ${profile.emailPublic ? "سيظهر للعامة" : "خاص"}` : "لم يضف بريد مهني"}</p>
            <p>{profile.phone ? `الهاتف: ${profile.phonePublic ? "سيظهر للعامة" : "خاص"}` : "لم يضف هاتف مهني"}</p>
          </section>
          {files.length > 0 ? <PreviewList title="الملفات المرفقة" id="preview-files">{files.map((file) => <li key={file.id}><strong>{file.originalName}</strong><span>{file.isPublic ? "سيظهر للعامة بعد النشر" : "خاص"}</span></li>)}</PreviewList> : null}
          <section className="profile-section preview-source-section">
            <p className="eyebrow">المصدر</p>
            <h2>{source ? source.title : "المصدر مطلوب قبل الإرسال"}</h2>
            <p>{source ? `${source.publisher} · ${source.url}` : "أضف مصدرًا موثوقًا بعنوان ورابط ونوع واضح."}</p>
          </section>
        </div>
        <div className="preview-actions">
          <Link className="button button-primary" href="/account/profile">العودة إلى التحرير</Link>
          <Link className="button button-quiet" href="/account">لوحة الحساب</Link>
        </div>
      </div>
    </main>
  );
}

function PreviewList({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return <section className="profile-section preview-list-section" aria-labelledby={id}><p className="eyebrow">{title}</p><h2 id={id}>{title}</h2><ul className="simple-list">{children}</ul></section>;
}
