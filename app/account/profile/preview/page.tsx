import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user/auth";
import { getProfileForUser } from "@/lib/user/profileRepository";
import { BiographyContent } from "@/components/a3lam/BiographyContent";
import Link from "next/link";

export const metadata: Metadata = { title: "معاينة الملف المهني", robots: { index: false, follow: false } };

export default async function ProfilePreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile/preview");
  const record = await getProfileForUser(user.id);
  if (!record) notFound();
  const { profile, categories, experiences, educations, skills, source } = record;
  return <main className="account-page"><div className="account-shell"><div className="account-panel profile-preview"><p className="eyebrow">معاينة خاصة — لا تظهر للعامة</p><h1>{profile.nameArabic}</h1><p className="profile-latin-name">{profile.name}</p><p className="profile-role">{profile.professionalTitle || "دون مسمى مهني"}</p><p className="profile-meta">{[profile.city, profile.country].filter(Boolean).join("، ")}</p><div className="profile-category-links">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>{profile.professionalSummary || profile.biography ? <section className="profile-section"><h2>النبذة</h2><BiographyContent value={profile.professionalSummary || profile.biography} /></section> : null}{skills.length > 0 ? <section className="profile-section"><h2>المهارات</h2><div className="skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section> : null}{experiences.length > 0 ? <section className="profile-section"><h2>الخبرات</h2><ul className="cv-list">{experiences.map((item) => <li key={item.id}><h3>{item.jobTitle}</h3><p>{item.organization}</p></li>)}</ul></section> : null}{educations.length > 0 ? <section className="profile-section"><h2>التعليم</h2><ul className="simple-list">{educations.map((item) => <li key={item.id}><strong>{item.institution}</strong><span>{[item.degree, item.field].filter(Boolean).join(" · ")}</span></li>)}</ul></section> : null}<section className="profile-section"><h2>الحالة والمصدر</h2><p>الحالة: {profile.status === "draft" ? "مسودة" : profile.status === "pending_review" ? "قيد المراجعة" : profile.status === "published" ? "منشور" : "مؤرشف"}</p><p>{source ? `المصدر: ${source.title} — ${source.publisher}` : "لم يضف مصدر بعد"}</p></section><Link className="button button-primary" href="/account/profile">العودة إلى التحرير</Link></div></div></main>;
}
