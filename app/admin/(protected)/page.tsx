import Link from "next/link";
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

function statusLabel(status: AdminStatus, copy: ReturnType<typeof getMessages>) {
  return status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : status === "published" ? copy.adminPublished : copy.adminArchived;
}

function availabilityLabel(value: string, copy: ReturnType<typeof getMessages>) {
  if (value === "available" || value === "ready") return copy.adminAvailable;
  if (value === "requires_configuration") return copy.adminRequiresConfiguration;
  if (value === "requires_migration") return copy.adminRequiresMigration;
  if (value === "requires_schema") return copy.adminRequiresSchema;
  return copy.adminUnavailable;
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
    { href: "/admin/users", title: copy.adminUsers, detail: copy.adminReadOnly, permission: "users.read" as const },
    { href: "/admin/administrators", title: copy.adminAdministrators, detail: copy.adminReadOnly, permission: "admins.read" as const },
    { href: "/admin/editors", title: copy.adminEditors, detail: copy.adminReadOnly, permission: "editors.read" as const },
    { href: "/admin/people", title: copy.adminPeople, detail: copy.adminReadOnly, permission: "people.read" as const },
    { href: "/admin/categories", title: copy.adminCategories, detail: copy.adminReadOnly, permission: "categories.read" as const },
    { href: "/admin/profiles", title: copy.adminProfiles, detail: copy.adminReview, permission: "profiles.read" as const },
    { href: "/admin/site", title: copy.adminSiteExperienceCenter, detail: copy.adminSiteExperienceCenterDescription, permission: "homepage.read" as const },
    { href: "/admin/audit", title: copy.adminAudit, detail: copy.adminReadOnly, permission: "audit.read" as const },
    { href: "/admin/system", title: copy.adminSystem, detail: copy.adminReadOnly, permission: "system.read" as const },
    { href: "/admin/launch", title: copy.adminLaunchControl, detail: copy.adminLaunchReadOnly, permission: "system.read" as const },
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
    { label: `${copy.adminPeople} · ${copy.adminPublished}`, value: dashboard?.counts.published ?? 0 },
    { label: `${copy.adminPeople} · ${copy.adminReview}`, value: dashboard?.counts.review ?? 0 },
    { label: copy.adminCategories, value: summary?.categories ?? 0 },
    { label: copy.adminUsers, value: summary?.users ?? 0 },
    { label: copy.adminUserActive, value: summary?.activeUsers ?? 0 },
    { label: copy.adminUserDisabled, value: summary ? summary.users - summary.activeUsers : null },
    { label: copy.adminProfiles, value: summary?.profiles.total ?? 0 },
    { label: `${copy.adminProfiles} · ${copy.adminPublished}`, value: summary?.profiles.published ?? 0 },
    { label: `${copy.adminProfiles} · ${copy.adminReview}`, value: summary?.profiles.pendingReview ?? 0 },
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
        {await can("people.create") ? <Link className="button button-primary" href="/admin/people/new">{copy.adminAddPerson}</Link> : null}
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
      <section className="admin-panel" aria-labelledby="admin-recent-audit-title">
        <div className="admin-section-heading"><h2 id="admin-recent-audit-title">{copy.adminRecentActivity}</h2><Link href="/admin/audit">{copy.adminAudit}</Link></div>
        {!summary?.recentAudit.length ? <p className="admin-empty">{copy.adminNoAudit}</p> : <div className="admin-audit-list">{summary.recentAudit.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></div><small>{formatDate(log.createdAt, "ar")}</small></article>)}</div>}
      </section>
      {health ? <section className="admin-panel" aria-labelledby="admin-health-title"><div className="admin-section-heading"><h2 id="admin-health-title">{copy.adminSystemHealth}</h2><Link href="/admin/system">{copy.adminSystem}</Link></div><div className="admin-status-summary"><span><b>{copy.adminDatabaseStatus}</b><strong>{availabilityLabel(health.database, copy)}</strong></span><span><b>{copy.adminMigrationStatus}</b><strong>{availabilityLabel(health.migrations.status, copy)}</strong></span><span><b>{copy.adminAuthStatus}</b><strong>{availabilityLabel(health.auth, copy)}</strong></span><span><b>{copy.adminSiteExperienceStatus}</b><strong>{availabilityLabel(health.siteExperience.status, copy)}</strong></span><span><b>{copy.adminMediaProvider}</b><strong>{availabilityLabel(health.storage, copy)}</strong></span><span><b>{copy.adminContactEmail}</b><strong>{availabilityLabel(health.email, copy)}</strong></span></div></section> : null}
    </div>
  );
}
