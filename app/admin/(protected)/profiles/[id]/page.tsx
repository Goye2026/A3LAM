import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProfile, listProfileAuditLogs } from "@/lib/user/profileRepository";
import { ProfileAdminActions } from "@/components/a3lam/ProfileAdminActions";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { PersonPortrait } from "@/components/a3lam/PersonPortrait";

export const metadata: Metadata = { title: "مراجعة الملف المهني", robots: { index: false, follow: false } };
type Props = { params: Promise<{ id: string }> };
const statusLabels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;

export default async function AdminProfileDetailPage({ params }: Props) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("profiles.read");
  const { id } = await params;
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const adminPrincipal = access.principal;
  if (!adminPrincipal) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let canModerate = false;
  let canPublish = false;
  try {
    [canModerate, canPublish] = await Promise.all([
      hasEffectiveAdminPermission(adminPrincipal, "profiles.moderate"),
      hasEffectiveAdminPermission(adminPrincipal, "profiles.publish"),
    ]);
  } catch {
    // Keep read-only review available while hiding mutation controls on dependency failure.
  }
  const [record, auditLogs] = await Promise.all([getAdminProfile(id), listProfileAuditLogs(id)]);
  if (!record) notFound();
  const { profile, categories, source, skills, experiences, educations, certifications, languages, portfolio, files } = record;
    const location = [profile.city, profile.country].filter(Boolean).join("، ");
  const readinessItems = [
    { key: "identity", label: `${copy.adminArabicName} / ${copy.adminEnglishName}`, ready: Boolean(profile.name.trim() && profile.nameArabic.trim() && profile.slug.trim()) },
    { key: "biography", label: `${copy.adminShortBio} / ${copy.adminBiography}`, ready: Boolean(profile.professionalSummary.trim() || profile.biography.trim()) },
    { key: "categories", label: copy.adminCategories, ready: categories.length > 0 && categories.every((category) => category.status === "published") },
    { key: "source", label: copy.adminSources, ready: Boolean(source) },
  ];
  const readinessReady = readinessItems.every((item) => item.ready);
  return <div className="admin-profile-detail">
<header className="admin-route-heading"><div><Link className="back-link" href="/admin/profiles">↙ العودة إلى الملفات</Link><p className="eyebrow">مراجعة مهنية</p><h1>{profile.nameArabic}</h1><p className="route-description">مراجعة المحتوى الكامل، وما سيظهر للعامة، وإعدادات الخصوصية قبل اتخاذ القرار.</p></div><ProfileAdminActions profileId={profile.id} status={profile.status} canModerate={canModerate} canPublish={canPublish} /></header><section className="admin-review-hero admin-panel"><PersonPortrait className="profile-avatar" src={profile.imageUrl} alt={profile.nameArabic} initials={profile.nameArabic.slice(0, 2)} tone="teal" /><div><p className="profile-latin-name">{profile.name}</p><h2>{profile.professionalTitle || "دون مسمى مهني"}</h2><p>{location || "دون مدينة أو دولة"}</p><div className="profile-category-links">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div></div><div className="admin-review-state"><b className={`admin-status admin-status-${profile.status}`}>{statusLabels[profile.status]}</b><span>{profile.visibility === "published" ? "عام" : profile.visibility === "unlisted" ? "غير مدرج" : "خاص"}</span></div></section><section className="admin-panel admin-profile-readiness" aria-labelledby="admin-profile-readiness-title"><div className="admin-section-heading"><h2 id="admin-profile-readiness-title">{copy.adminReadinessTitle}</h2><span className={`admin-readiness-badge ${readinessReady ? "is-ready" : "is-blocked"}`} role="status">{readinessReady ? copy.adminReadinessReady : copy.adminReadinessBlockedLabel}</span></div><p className="admin-field-hint">{copy.adminReadinessPublishHint}</p><ul className="admin-readiness-list">{readinessItems.map((item) => <li className={item.ready ? "is-ready" : "is-incomplete"} key={item.key}><span aria-hidden="true">{item.ready ? "✓" : "—"}</span><span>{item.label}</span><strong>{item.ready ? copy.adminReadinessReady : copy.adminReadinessIncomplete}</strong></li>)}</ul></section><div className="admin-review-grid"><main>
<section className="admin-panel"><p className="eyebrow">الإسقاط العام</p><h2>ما سيظهر للعامة</h2><p className="profile-role">{profile.professionalTitle || "دون مسمى مهني"}</p><p>{profile.professionalSummary || profile.biography || "لا توجد نبذة بعد."}</p>{skills.length > 0 ? <div className="skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}</section>{experiences.length > 0 ? <ReviewList title="الخبرات">{experiences.map((item) => <li key={item.id}><strong>{item.jobTitle}</strong><span>{item.organization} · {item.location}</span><small>{item.startDate || ""}{item.startDate || item.endDate || item.isCurrent ? " — " : ""}{item.isCurrent ? "حتى الآن" : item.endDate || ""}</small><p>{item.description}</p></li>)}</ReviewList> : null}{educations.length > 0 ? <ReviewList title="التعليم">{educations.map((item) => <li key={item.id}><strong>{item.institution}</strong><span>{[item.degree, item.field].filter(Boolean).join(" · ")}</span><small>{item.startDate || ""}{item.startDate || item.endDate ? " — " : ""}{item.endDate || ""}</small></li>)}</ReviewList> : null}{certifications.length > 0 ? <ReviewList title="الشهادات">{certifications.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.issuer}</span></li>)}</ReviewList> : null}{languages.length > 0 ? <ReviewList title="اللغات">{languages.map((item) => <li key={item.id}><strong>{item.language}</strong><span>{item.proficiency}</span></li>)}</ReviewList> : null}{portfolio.length > 0 ? <ReviewList title="الأعمال والمشاريع">{portfolio.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.description}</span>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" dir="ltr">{item.url}</a> : null}</li>)}</ReviewList> : null}</main><aside className="admin-review-sidebar"><section className="admin-panel"><p className="eyebrow">الخصوصية</p><h2>بيانات الاتصال</h2><div className="privacy-review-row"><span>البريد</span><strong>{profile.contactEmail || "غير مضاف"}</strong><small>{profile.emailPublic ? "Public — سيظهر" : "Private — محجوب"}</small></div><div className="privacy-review-row"><span>الهاتف</span><strong>{profile.phone || "غير مضاف"}</strong><small>{profile.phonePublic ? "Public — سيظهر" : "Private — محجوب"}</small></div><p className="section-help">يُحسم الإسقاط العام server-side، ولا تعتمد الخصوصية على CSS أو إخفاء الواجهة.</p></section><section className="admin-panel"><p className="eyebrow">المصدر</p><h2>{source?.title || "لا يوجد مصدر"}</h2>{source ? <><p>{source.publisher}</p><a href={source.url} target="_blank" rel="noopener noreferrer" dir="ltr">{source.url}</a><small className="source-type">{source.type} · {source.status}</small></> : <p className="admin-alert">لا يمكن نشر الملف دون مصدر صالح.</p>}</section><section className="admin-panel"><p className="eyebrow">الملفات</p><h2>{files.length} ملفًا</h2>{files.length > 0 ? <ul className="simple-list">{files.map((file) => <li key={file.id}><strong>{file.originalName}</strong><span>{file.mimeType} · {file.isPublic ? "Public" : "Private"}</span></li>)}</ul> : <p className="admin-empty">لا توجد ملفات.</p>}</section><section className="admin-panel"><p className="eyebrow">سجل moderation</p><h2>{auditLogs.length} انتقالات</h2>{auditLogs.length > 0 ? <ul className="simple-list">{auditLogs.map((log) => <li key={log.id}><strong>{log.oldValue || "—"} → {log.newValue || "—"}</strong><span>{log.action} · {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</span></li>)}</ul> : <p className="admin-empty">لا توجد انتقالات مسجلة بعد.</p>}</section></aside></div></div>;
}

function ReviewList({ title, children }: { title: string; children: React.ReactNode }) { return <section className="admin-panel"><p className="eyebrow">{title}</p><h2>{title}</h2><ul className="simple-list">{children}</ul></section>; }
