import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";

function formatDate(value: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

type AdminStatus = "draft" | "review" | "published" | "archived";

function statusLabel(status: AdminStatus, copy: FoundationMessages) {
  return status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : status === "published" ? copy.adminPublished : copy.adminArchived;
}

export default async function AdminDashboardPage() {
  const copy = getMessages(defaultLocale);
  let dashboard: Awaited<ReturnType<typeof adminRepository.getDashboard>> | null = null;
  let unavailable = false;
  try {
    dashboard = await adminRepository.getDashboard();
  } catch {
    unavailable = true;
  }
  const statuses = [
    ["draft", copy.adminDraft],
    ["review", copy.adminReview],
    ["published", copy.adminPublished],
    ["archived", copy.adminArchived],
  ] as const;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div>
          <p className="eyebrow">{copy.adminTitle}</p>
          <h1>{copy.adminDashboard}</h1>
          <p className="route-description">{copy.adminSubtitle}</p>
        </div>
        <Link className="button button-primary" href="/admin/people/new">{copy.adminAddPerson}</Link>
      </header>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      <section className="admin-stat-grid" aria-label={copy.adminDashboard}>
        <div className="admin-stat-card admin-stat-featured"><span>{copy.adminPeopleCount}</span><strong>{dashboard?.counts.draft !== undefined ? Object.values(dashboard.counts).reduce((sum, value) => sum + value, 0) : 0}</strong></div>
        {statuses.map(([key, label]) => <div className="admin-stat-card" key={key}><span>{label}</span><strong>{dashboard?.counts[key] ?? 0}</strong></div>)}
      </section>
      <section className="admin-shortcuts" aria-labelledby="admin-shortcuts-title">
        <div className="admin-section-heading"><h2 id="admin-shortcuts-title">{copy.adminReviewContent}</h2></div>
        <div className="admin-action-grid">
          <Link href="/admin/people/new" className="admin-action-card"><strong>{copy.adminAddPerson}</strong><span>{copy.adminBasicInformation}</span></Link>
          <Link href="/admin/people?status=review" className="admin-action-card"><strong>{copy.adminReviewContent}</strong><span>{copy.adminReview}</span></Link>
          <Link href="/admin/people?status=published" className="admin-action-card"><strong>{copy.adminPublished}</strong><span>{copy.adminPeople}</span></Link>
          <Link href="/admin/people?status=draft" className="admin-action-card"><strong>{copy.adminDraft}</strong><span>{copy.adminPeople}</span></Link>
          <Link href="/admin/profiles" className="admin-action-card"><strong>الملفات المهنية</strong><span>مراجعة ملفات المستخدمين</span></Link>
        </div>
      </section>
      <section className="admin-panel" aria-labelledby="admin-recent-title">
        <div className="admin-section-heading"><h2 id="admin-recent-title">{copy.adminRecentUpdates}</h2><Link href="/admin/people">{copy.adminPeople}</Link></div>
        {!dashboard?.recent.length ? <p className="admin-empty">{copy.adminNoRecent}</p> : <div className="admin-recent-list">{dashboard.recent.map((person) => <Link href={`/admin/people/${person.id}`} className="admin-recent-row" key={person.id}><span><strong>{person.nameArabic}</strong><small>{person.categories.join(" · ") || "—"}</small></span><span><b className={`admin-status admin-status-${person.status}`}>{statusLabel(person.status, copy)}</b><small>{formatDate(person.updatedAt, "ar")}</small></span></Link>)}</div>}
      </section>
    </div>
  );
}
