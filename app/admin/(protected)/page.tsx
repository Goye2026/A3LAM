import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { cookies } from "next/headers";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";

function formatDate(value: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

type AdminStatus = "draft" | "review" | "published" | "archived";

function statusLabel(status: AdminStatus, copy: FoundationMessages) {
  return status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : status === "published" ? copy.adminPublished : copy.adminArchived;
}

export default async function AdminDashboardPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const can = async (permission: Parameters<typeof hasEffectiveAdminPermission>[1]) => Boolean(principal && await hasEffectiveAdminPermission(principal, permission));
  let dashboard: Awaited<ReturnType<typeof adminRepository.getDashboard>> | null = null;
  let summary: Awaited<ReturnType<typeof adminRepository.getControlCenterSummary>> | null = null;
  let unavailable = false;
  let health: Awaited<ReturnType<typeof getSystemHealthSnapshot>> | null = null;
  try {
    [dashboard, summary] = await Promise.all([adminRepository.getDashboard(), adminRepository.getControlCenterSummary()]);
    if (await can("system.read")) health = await getSystemHealthSnapshot();
  } catch {
    unavailable = true;
  }
  const quickActions = [
    { href: "/admin/people/new", title: copy.adminAddPerson, detail: copy.adminBasicInformation, permission: "people.create" as const },
    { href: "/admin/people?status=review", title: copy.adminReviewContent, detail: copy.adminReview, permission: "people.publish" as const },
    { href: "/admin/profiles", title: copy.adminProfiles, detail: copy.adminReview, permission: "profiles.moderate" as const },
    { href: "/admin/users", title: copy.adminUsers, detail: copy.adminReadOnly, permission: "users.read" as const },
    { href: "/admin/audit", title: copy.adminAudit, detail: copy.adminReadOnly, permission: "audit.read" as const },
  ];
  const visibleQuickActions = [] as typeof quickActions;
  for (const action of quickActions) if (await can(action.permission)) visibleQuickActions.push(action);
  const statuses = [
    ["draft", copy.adminDraft],
    ["review", copy.adminReview],
    ["published", copy.adminPublished],
    ["archived", copy.adminArchived],
  ] as const;
  const stats = [
    { label: copy.adminPeopleCount, value: summary?.people ?? 0, featured: true },
    { label: copy.adminCategories, value: summary?.categories ?? 0 },
    { label: copy.adminUsers, value: summary?.users ?? 0 },
    { label: copy.adminUserActive, value: summary?.activeUsers ?? 0 },
    { label: copy.adminProfiles, value: summary?.profiles.total ?? 0 },
    { label: copy.adminReview, value: summary?.profiles.pendingReview ?? 0 },
    { label: copy.adminAdministrators, value: summary?.adminIdentities ?? null },
    { label: copy.adminEditors, value: summary?.editors ?? null },
    { label: copy.adminSessions, value: summary?.adminSessions ?? null },
  ];

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div>
          <p className="eyebrow">{copy.adminControlCenter}</p>
          <h1>{copy.adminDashboard}</h1>
          <p className="route-description">{copy.adminControlCenterDescription}</p>
        </div>
        <Link className="button button-primary" href="/admin/people/new">{copy.adminAddPerson}</Link>
      </header>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      <section className="admin-stat-grid admin-control-stat-grid" aria-label={copy.adminControlCenter}>
        {stats.map((stat) => <div className={`admin-stat-card${stat.featured ? " admin-stat-featured" : ""}`} key={stat.label}><span>{stat.label}</span><strong>{summary && stat.value !== null ? stat.value : "—"}</strong></div>)}
      </section>
      <section className="admin-panel" aria-labelledby="admin-status-title">
        <div className="admin-section-heading"><h2 id="admin-status-title">{copy.adminPeople}</h2><Link href="/admin/people">{copy.adminPeople}</Link></div>
        <div className="admin-status-summary">{statuses.map(([key, label]) => <Link href={`/admin/people?status=${key}`} key={key}><span>{label}</span><strong>{dashboard?.counts[key] ?? "—"}</strong></Link>)}</div>
      </section>
      <section className="admin-shortcuts" aria-labelledby="admin-shortcuts-title">
        <div className="admin-section-heading"><h2 id="admin-shortcuts-title">{copy.adminQuickActions}</h2></div>
        {visibleQuickActions.length > 0 ? <div className="admin-action-grid">{visibleQuickActions.map((action) => <Link href={action.href} className="admin-action-card" key={action.href}><strong>{action.title}</strong><span>{action.detail}</span></Link>)}</div> : <p className="admin-empty">{copy.adminReadOnly}</p>}
      </section>
      <section className="admin-panel" aria-labelledby="admin-recent-title">
        <div className="admin-section-heading"><h2 id="admin-recent-title">{copy.adminRecentUpdates}</h2><Link href="/admin/people">{copy.adminPeople}</Link></div>
        {!dashboard?.recent.length ? <p className="admin-empty">{copy.adminNoRecent}</p> : <div className="admin-recent-list">{dashboard.recent.map((person) => <Link href={`/admin/people/${person.id}`} className="admin-recent-row" key={person.id}><span><strong>{person.nameArabic}</strong><small>{person.categories.join(" · ") || "—"}</small></span><span><b className={`admin-status admin-status-${person.status}`}>{statusLabel(person.status, copy)}</b><small>{formatDate(person.updatedAt, "ar")}</small></span></Link>)}</div>}
      </section>
      <section className="admin-panel" aria-labelledby="admin-recent-audit-title"><div className="admin-section-heading"><h2 id="admin-recent-audit-title">{copy.adminRecentActivity}</h2><Link href="/admin/audit">{copy.adminAudit}</Link></div>{!summary?.recentAudit.length ? <p className="admin-empty">{copy.adminNoAudit}</p> : <div className="admin-audit-list">{summary.recentAudit.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></div><small>{formatDate(log.createdAt, "ar")}</small></article>)}</div>}</section>
      {health ? <section className="admin-panel" aria-labelledby="admin-health-title"><div className="admin-section-heading"><h2 id="admin-health-title">{copy.adminSystemHealth}</h2><Link href="/admin/system">{copy.adminSystem}</Link></div><div className="admin-status-summary"><span><b>{copy.adminDatabaseStatus}</b><strong>{health.database === "available" ? copy.adminAvailable : copy.adminUnavailable}</strong></span><span><b>{copy.adminMediaProvider}</b><strong>{health.storage === "ready" ? copy.adminAvailable : copy.adminRequiresConfiguration}</strong></span><span><b>{copy.adminContactEmail}</b><strong>{copy.adminRequiresConfiguration}</strong></span></div></section> : null}
    </div>
  );
}
