import Link from "next/link";
import { cookies } from "next/headers";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";
import { AdminMetricCard } from "@/components/a3lam/AdminDesignSystem";
import { toDashboardMetricView } from "@/lib/admin/dashboardView";
import { editorialRepository } from "@/lib/cms/editorialRepository";

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

function cmsStatusLabel(status: string, copy: ReturnType<typeof getMessages>) {
  if (status === "review") return copy.adminReview;
  if (status === "published") return copy.adminPublished;
  if (status === "scheduled") return copy.adminCmsStatusScheduled;
  if (status === "trashed") return copy.adminCmsStatusTrashed;
  return copy.adminDraft;
}

export default async function AdminDashboardPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const can = async (permission: Parameters<typeof hasEffectiveAdminPermission>[1]) => Boolean(principal && await hasEffectiveAdminPermission(principal, permission));
  let dashboard: Awaited<ReturnType<typeof adminRepository.getDashboard>> | null = null;
  let summary: Awaited<ReturnType<typeof adminRepository.getControlCenterSummary>> | null = null;
  let unavailable = false;
  let health: Awaited<ReturnType<typeof getSystemHealthSnapshot>> | null = null;
  let cmsWorkspace: Awaited<ReturnType<typeof editorialRepository.getWorkspaceSummary>> | null = null;
  let recentCms: Array<{ id: string; kind: "page" | "post"; title: string; slug: string; status: string; updatedAt: string; publishedAt: string | null }> = [];
  let cmsUnavailable = false;
  try {
    [dashboard, summary] = await Promise.all([adminRepository.getDashboard(), adminRepository.getControlCenterSummary()]);
    if (await can("system.read")) health = await getSystemHealthSnapshot();
  } catch {
    unavailable = true;
  }
  if (await can("content.read")) {
    try {
      const [workspace, pages, posts] = await Promise.all([
        editorialRepository.getWorkspaceSummary(),
        editorialRepository.list("page", { page: 1, pageSize: 5, sort: "updated_desc" }),
        editorialRepository.list("post", { page: 1, pageSize: 5, sort: "updated_desc" }),
      ]);
      cmsWorkspace = workspace;
      recentCms = [...pages.items.map((item) => ({ ...item, kind: "page" as const })), ...posts.items.map((item) => ({ ...item, kind: "post" as const }))]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
    } catch {
      cmsUnavailable = true;
    }
  }
  const quickActions = [
    { href: "/admin/content/pages/new", title: copy.adminCmsCreatePage, detail: copy.adminCmsEditor, permission: "content.create" as const },
    { href: "/admin/content/posts/new", title: copy.adminCmsCreatePost, detail: copy.adminCmsEditor, permission: "content.create" as const },
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
    { href: "/admin/ai", title: copy.adminAi, detail: copy.adminAiDescription, permission: "ai.documents.read" as const },
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
    { label: copy.adminPeopleCount, value: summary?.people ?? null, featured: true },
    { label: `${copy.adminPeople} · ${copy.adminPublished}`, value: dashboard?.counts.published ?? null },
    { label: `${copy.adminPeople} · ${copy.adminReview}`, value: dashboard?.counts.review ?? null },
    { label: copy.adminCategories, value: summary?.categories ?? null },
    { label: copy.adminUsers, value: summary?.users ?? null },
    { label: copy.adminUserActive, value: summary?.activeUsers ?? null },
    { label: copy.adminUserDisabled, value: summary ? summary.users - summary.activeUsers : null },
    { label: copy.adminProfiles, value: summary?.profiles.total ?? null },
    { label: `${copy.adminProfiles} · ${copy.adminPublished}`, value: summary?.profiles.published ?? null },
    { label: `${copy.adminProfiles} · ${copy.adminReview}`, value: summary?.profiles.pendingReview ?? null },
    { label: copy.adminAdministrators, value: summary?.adminIdentities ?? null },
    { label: copy.adminEditors, value: summary?.editors ?? null },
    { label: copy.adminSessions, value: summary?.adminSessions ?? null },
    { label: copy.adminCmsPages, value: cmsWorkspace?.page.total ?? null },
    { label: copy.adminCmsPosts, value: cmsWorkspace?.post.total ?? null },
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
        {stats.map((stat) => { const view = toDashboardMetricView(stat); return <AdminMetricCard key={view.label} label={view.label} value={view.displayValue} featured={view.featured} />; })}
      </section>
      <section className="admin-panel" aria-labelledby="admin-status-title">
        <div className="admin-section-heading"><h2 id="admin-status-title">{copy.adminPeople}</h2><Link href="/admin/people">{copy.adminPeople}</Link></div>
        <div className="admin-status-summary">{statuses.map(([key, label]) => <Link href={`/admin/people?status=${key}`} key={key}><span>{label}</span><strong>{dashboard?.counts[key] ?? "—"}</strong></Link>)}</div>
      </section>
      <section className="admin-shortcuts" aria-labelledby="admin-shortcuts-title">
        <div className="admin-section-heading"><h2 id="admin-shortcuts-title">{copy.adminQuickActions}</h2></div>
        {visibleQuickActions.length > 0 ? <div className="admin-action-grid">{visibleQuickActions.map((action) => <Link href={action.href} className="admin-action-card" key={action.href}><strong>{action.title}</strong><span>{action.detail}</span></Link>)}</div> : <p className="admin-empty">{copy.adminReadOnly}</p>}
      </section>
      {await can("content.read") ? <section className="admin-panel admin-cms-overview" aria-labelledby="admin-cms-overview-title">
        <div className="admin-section-heading"><div><h2 id="admin-cms-overview-title">{copy.adminContent}</h2><p className="route-description">{copy.adminCmsEditor}</p></div><div className="admin-form-actions"><Link className="button button-quiet" href="/admin/content/pages">{copy.adminCmsPages}</Link><Link className="button button-quiet" href="/admin/content/posts">{copy.adminCmsPosts}</Link></div></div>
        {cmsUnavailable ? <p className="admin-alert" role="alert">{copy.adminCmsRequiresMigration}</p> : <div className="admin-cms-status-grid"><Link href="/admin/content/pages?status=draft"><span>{copy.adminCmsPages} · {copy.adminDraft}</span><strong>{cmsWorkspace?.page.draft ?? "—"}</strong></Link><Link href="/admin/content/pages?status=review"><span>{copy.adminCmsPages} · {copy.adminReview}</span><strong>{cmsWorkspace?.page.review ?? "—"}</strong></Link><Link href="/admin/content/posts?status=draft"><span>{copy.adminCmsPosts} · {copy.adminDraft}</span><strong>{cmsWorkspace?.post.draft ?? "—"}</strong></Link><Link href="/admin/content/posts?status=review"><span>{copy.adminCmsPosts} · {copy.adminReview}</span><strong>{cmsWorkspace?.post.review ?? "—"}</strong></Link></div>}
      </section> : null}
      {await can("content.read") && !cmsUnavailable ? <section className="admin-panel" aria-labelledby="admin-recent-cms-title"><div className="admin-section-heading"><h2 id="admin-recent-cms-title">{copy.adminRecentUpdates} · {copy.adminContent}</h2><Link href="/admin/content">{copy.adminContent}</Link></div>{recentCms.length === 0 ? <p className="admin-empty">{copy.adminCmsNoItems}</p> : <div className="admin-recent-list admin-cms-recent-list">{recentCms.map((item) => <Link href={`/admin/content/${item.kind === "page" ? "pages" : "posts"}/${item.id}`} className="admin-recent-row" key={`${item.kind}-${item.id}`}><span><strong>{item.title}</strong><small dir="ltr">/{item.slug}</small></span><span><b className={`admin-status admin-status-${item.status === "published" ? "published" : item.status === "review" ? "review" : "draft"}`}>{cmsStatusLabel(item.status, copy)}</b><small dir="ltr">{formatDate(item.updatedAt, "ar")}</small></span></Link>)}</div>}</section> : null}
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
