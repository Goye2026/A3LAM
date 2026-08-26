import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getLaunchControlData } from "@/lib/admin/launchRepository";
import type { LaunchReadinessItem, LaunchStatus, ReadinessMode } from "@/lib/admin/launch";

export const metadata: Metadata = {
  title: "Launch Control",
  robots: { index: false, follow: false },
};

function statusLabel(status: LaunchStatus, copy: ReturnType<typeof getMessages>) {
  switch (status) {
    case "READY": return copy.adminLaunchReady;
    case "READY_WITH_LIMITATIONS": return copy.adminLaunchReadyWithLimitations;
    case "REQUIRES_CONFIGURATION": return copy.adminLaunchRequiresConfiguration;
    case "NOT_TESTED": return copy.adminLaunchNotTested;
    case "BLOCKED": return copy.adminLaunchBlocked;
    case "NOT_APPLICABLE": return copy.adminLaunchNotApplicable;
  }
}

function contentStatusLabel(status: "draft" | "review" | "published" | "archived", copy: ReturnType<typeof getMessages>) {
  return status === "draft" ? copy.adminDraft : status === "review" ? copy.adminReview : status === "published" ? copy.adminPublished : copy.adminArchived;
}

function personReadinessLabel(state: "READY_FOR_REVIEW" | "READY_FOR_PUBLICATION" | "INCOMPLETE" | "BLOCKED", copy: ReturnType<typeof getMessages>) {
  if (state === "INCOMPLETE") return copy.adminReadinessIncomplete;
  if (state === "BLOCKED") return copy.adminReadinessBlockedLabel;
  return copy.adminReadinessReady;
}

function statusClass(status: LaunchStatus) {
  return `admin-launch-status admin-launch-status-${status.toLowerCase()}`;
}

function healthLabel(value: string, copy: ReturnType<typeof getMessages>) {
  if (["available", "configured", "ready"].includes(value)) return copy.adminAvailable;
  if (["requires_configuration", "not_configured", "invalid_configuration"].includes(value)) return copy.adminRequiresConfiguration;
  if (["requires_migration", "requires_schema"].includes(value)) return copy.adminRequiresMigration;
  return copy.adminUnavailable;
}

function modeLabel(mode: ReadinessMode, copy: ReturnType<typeof getMessages>) {
  if (mode === "AUTOMATIC") return copy.adminLaunchModeAutomatic;
  if (mode === "MANUAL") return copy.adminLaunchModeManual;
  return copy.adminLaunchModeExternal;
}

function domainRows(data: Awaited<ReturnType<typeof getLaunchControlData>>, copy: ReturnType<typeof getMessages>): LaunchReadinessItem[] {
  const health = data.health;
  const migration = data.migrations;
  const editorialBlocked = data.editorialSample.some((item) => item.readiness.state === "BLOCKED");
  const editorialIncomplete = data.editorialSample.some((item) => item.readiness.state === "INCOMPLETE");
  const media = health?.media;
  const mediaLimited = media && (media.provider !== "configured" || media.metadata !== "available" || media.upload !== "available" || media.publicDelivery !== "available");
  const migrationStatus: LaunchStatus = !migration ? "NOT_TESTED" : migration.status === "inconsistent" ? "BLOCKED" : migration.status === "pending" ? "READY_WITH_LIMITATIONS" : migration.status === "healthy" ? "READY" : "NOT_TESTED";
  const migrationEvidence = !migration
    ? copy.adminLaunchNoData
    : `${copy.adminLaunchEvidenceMigration} ${migration.appliedCount}/${migration.expectedCount} · ${migration.pendingCount}`;
  return [
    { id: "application", domain: "application", label: copy.adminLaunchApplication, status: "READY_WITH_LIMITATIONS", mode: "AUTOMATIC", evidence: copy.adminLaunchEvidenceApplication, owner: copy.adminLaunchNextStep },
    { id: "database", domain: "database", label: copy.adminLaunchDatabase, status: health?.database === "available" ? "READY" : health ? "BLOCKED" : "NOT_TESTED", mode: "AUTOMATIC", evidence: health ? (health.database === "available" ? copy.adminAvailable : copy.adminUnavailable) : copy.adminLaunchNoData, owner: copy.adminSystem },
    { id: "migrations", domain: "migrations", label: copy.adminLaunchMigrations, status: migrationStatus, mode: "AUTOMATIC", evidence: migrationEvidence, owner: migration?.pendingCount ? copy.adminLaunchEvidenceMigrationAction : copy.adminLaunchNextStep, href: "/admin/system" },
    { id: "authentication", domain: "authentication", label: copy.adminLaunchAuthentication, status: health?.auth === "available" ? "READY" : health ? "REQUIRES_CONFIGURATION" : "NOT_TESTED", mode: "AUTOMATIC", evidence: health ? `${copy.adminLaunchEvidenceAuthentication} ${healthLabel(health.auth, copy)}` : copy.adminLaunchNoData, owner: "/admin/login", href: "/admin/system" },
    { id: "rbac", domain: "rbac", label: copy.adminLaunchRbac, status: "READY_WITH_LIMITATIONS", mode: "AUTOMATIC", evidence: copy.adminLaunchEvidenceRbac, owner: copy.adminLaunchNextStep, href: "/admin/permissions" },
    { id: "editorial", domain: "editorial", label: copy.adminLaunchEditorial, status: data.editorialSampleUnavailable || editorialBlocked || editorialIncomplete ? "READY_WITH_LIMITATIONS" : "READY", mode: editorialBlocked ? "MANUAL" : "AUTOMATIC", evidence: data.editorialSampleUnavailable ? copy.adminLaunchNoData : `${copy.adminLaunchEvidenceEditorial} ${data.editorialSample.length}`, owner: copy.adminLaunchPeopleReadiness, href: "/admin/people" },
    { id: "media", domain: "media", label: copy.adminLaunchMedia, status: !media ? "NOT_TESTED" : mediaLimited ? "READY_WITH_LIMITATIONS" : "READY", mode: mediaLimited ? "EXTERNAL" : "AUTOMATIC", evidence: !media ? copy.adminLaunchNoData : `${copy.adminLaunchEvidenceMedia} ${healthLabel(media.provider, copy)} · ${healthLabel(media.metadata, copy)} · ${healthLabel(media.upload, copy)} · ${healthLabel(media.publicDelivery, copy)}`, owner: mediaLimited ? copy.adminRequiresConfiguration : copy.adminLaunchNextStep, href: "/admin/media" },
    { id: "seo", domain: "seo", label: copy.adminLaunchSeo, status: "READY_WITH_LIMITATIONS", mode: "MANUAL", evidence: copy.adminLaunchEvidenceSeo, owner: "/admin/seo", href: "/admin/seo" },
    { id: "site-experience", domain: "site_experience", label: copy.adminLaunchSiteExperience, status: health?.siteExperience.status === "available" && (health.siteExperience.published ?? 0) > 0 ? "READY" : health ? "READY_WITH_LIMITATIONS" : "NOT_TESTED", mode: "AUTOMATIC", evidence: health ? `${copy.adminLaunchEvidenceSiteExperience} ${health.siteExperience.resources ?? "—"} · ${health.siteExperience.published ?? "—"} · ${health.siteExperience.drafts ?? "—"}` : copy.adminLaunchNoData, owner: "/admin/site", href: "/admin/site" },
    { id: "operations", domain: "operations", label: copy.adminLaunchOperations, status: data.documentation.backup && data.documentation.restore ? "READY_WITH_LIMITATIONS" : "NOT_TESTED", mode: "EXTERNAL", evidence: data.documentation.backup && data.documentation.restore ? copy.adminLaunchEvidenceOperations : copy.adminLaunchNoData, owner: copy.adminLaunchNextStep, href: "/admin/system" },
    { id: "portability", domain: "portability", label: copy.adminLaunchPortability, status: data.documentation.portability ? "READY_WITH_LIMITATIONS" : "NOT_TESTED", mode: "EXTERNAL", evidence: data.documentation.portability ? copy.adminLaunchEvidencePortability : copy.adminLaunchNoData, owner: copy.adminLaunchDocker, href: "/admin/system" },
    { id: "android", domain: "android", label: copy.adminLaunchAndroid, status: data.documentation.android ? "READY_WITH_LIMITATIONS" : "NOT_TESTED", mode: "EXTERNAL", evidence: data.documentation.android ? copy.adminLaunchEvidenceAndroid : copy.adminLaunchNoData, owner: copy.adminLaunchEvidenceAndroid },
    { id: "domain", domain: "domain", label: copy.adminLaunchDomain, status: data.documentation.domain ? "REQUIRES_CONFIGURATION" : "NOT_TESTED", mode: "EXTERNAL", evidence: data.documentation.domain ? copy.adminLaunchEvidenceDomain : copy.adminLaunchNoData, owner: copy.adminLaunchCustomDomain, href: "/admin/system" },
  ];
}

export default async function LaunchControlPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "system.read"))) {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  }
  const data = await getLaunchControlData();
  const items = domainRows(data, copy);
  const links = [
    ["/admin/people", copy.adminPeople, "people.read"],
    ["/admin/categories", copy.adminCategories, "categories.read"],
    ["/admin/profiles", copy.adminProfiles, "profiles.read"],
    ["/admin/users", copy.adminUsers, "users.read"],
    ["/admin/administrators", copy.adminAdministrators, "admins.read"],
    ["/admin/sessions", copy.adminSessions, "sessions.read"],
    ["/admin/audit", copy.adminAudit, "audit.read"],
    ["/admin/media", copy.adminMedia, "media.read"],
    ["/admin/site", copy.adminSiteExperienceCenter, "homepage.read"],
    ["/admin/system", copy.adminSystem, "system.read"],
  ] as const;
  const visibleLinks = [] as Array<readonly [string, string, typeof links[number][2]]>;
  for (const link of links) if (await hasEffectiveAdminPermission(principal, link[2])) visibleLinks.push(link);
  const hrefPermissions = new Map<string, Parameters<typeof hasEffectiveAdminPermission>[1]>([
    ["/admin/system", "system.read"],
    ["/admin/permissions", "permissions.read"],
    ["/admin/people", "people.read"],
    ["/admin/media", "media.read"],
    ["/admin/seo", "seo.read"],
    ["/admin/site", "homepage.read"],
  ]);
  const allowedItemLinks = new Set<string>();
  for (const item of items) {
    const permission = item.href ? hrefPermissions.get(item.href) : undefined;
    if (item.href && (!permission || await hasEffectiveAdminPermission(principal, permission))) allowedItemLinks.add(item.href);
  }
  const statuses = items.reduce<Record<LaunchStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { READY: 0, READY_WITH_LIMITATIONS: 0, REQUIRES_CONFIGURATION: 0, NOT_TESTED: 0, BLOCKED: 0, NOT_APPLICABLE: 0 });

  return (
    <div className="admin-route admin-launch-route">
      <header className="admin-route-heading">
        <div>
          <p className="eyebrow">{copy.adminControlCenter}</p>
          <h1>{copy.adminLaunchControl}</h1>
          <p className="route-description">{copy.adminLaunchControlDescription}</p>
        </div>
      </header>
      <p className="admin-alert admin-launch-readonly" role="status">{copy.adminLaunchReadOnly} {copy.adminLaunchNoMutation}</p>
      <section className="admin-stat-grid admin-launch-stat-grid" aria-label={copy.adminLaunchStatus}>
        <div className="admin-stat-card"><span>{copy.adminLaunchReady}</span><strong>{statuses.READY}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminLaunchReadyWithLimitations}</span><strong>{statuses.READY_WITH_LIMITATIONS}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminLaunchRequiresConfiguration}</span><strong>{statuses.REQUIRES_CONFIGURATION}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminLaunchNotTested}</span><strong>{statuses.NOT_TESTED}</strong></div>
        <div className="admin-stat-card"><span>{copy.adminLaunchBlocked}</span><strong>{statuses.BLOCKED}</strong></div>
      </section>
      <section className="admin-panel" aria-labelledby="launch-domains-title">
        <div className="admin-section-heading"><h2 id="launch-domains-title">{copy.adminLaunchChecklist}</h2><span>{items.length} {copy.adminLaunchDomainCountSuffix}</span></div>
        <div className="admin-launch-table-wrap">
          <table className="admin-table admin-launch-table">
            <thead><tr><th>{copy.adminLaunchStatus}</th><th>{copy.adminLaunchDomainLabel}</th><th>{copy.adminLaunchEvidence}</th><th>{copy.adminLaunchOwner}</th><th>{copy.adminLaunchMode}</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}><td><span className={statusClass(item.status)}>{statusLabel(item.status, copy)}</span></td><td>{item.href && allowedItemLinks.has(item.href) ? <Link href={item.href}>{item.label}</Link> : item.label}</td><td>{item.evidence}</td><td>{item.owner}</td><td>{modeLabel(item.mode, copy)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel" aria-labelledby="launch-summary-title">
        <div className="admin-section-heading"><h2 id="launch-summary-title">{copy.adminControlCenter}</h2><Link href="/admin/system">{copy.adminSystem}</Link></div>
        {data.summary ? <div className="admin-status-summary"><span><b>{copy.adminPeople}</b><strong>{data.summary.people}</strong></span><span><b>{copy.adminCategories}</b><strong>{data.summary.categories}</strong></span><span><b>{copy.adminUsers}</b><strong>{data.summary.users}</strong></span><span><b>{copy.adminProfiles}</b><strong>{data.summary.profiles.total}</strong></span><span><b>{copy.adminAdministrators}</b><strong>{data.summary.adminIdentities ?? "—"}</strong></span><span><b>{copy.adminSessions}</b><strong>{data.summary.adminSessions ?? "—"}</strong></span></div> : <p className="admin-empty">{copy.adminLaunchNoData}</p>}
      </section>
      <section className="admin-panel" aria-labelledby="launch-migration-title">
        <div className="admin-section-heading"><h2 id="launch-migration-title">{copy.adminMigrationRegistryTitle}</h2><Link href="/admin/system">{copy.adminSystem}</Link></div>
        {data.migrations ? <div className="admin-status-summary"><span><b>{copy.adminAppliedMigrations}</b><strong>{data.migrations.appliedCount}</strong></span><span><b>{copy.adminPendingMigrations}</b><strong>{data.migrations.pendingCount}</strong></span><span><b>{copy.adminExpectedMigrations}</b><strong>{data.migrations.expectedCount}</strong></span><span><b>{copy.adminMigrationUnexpected}</b><strong>{data.migrations.items.filter((item) => item.state === "UNEXPECTED").length}</strong></span><span><b>{copy.adminMigrationInconsistent}</b><strong>{data.migrations.status === "inconsistent" ? copy.adminMigrationInconsistent : copy.adminMigrationRegistryHealthy}</strong></span><span><b>{copy.adminMigrationVersion}</b><strong>{data.migrations.items.filter((item) => item.state === "APPLIED").at(-1)?.version ?? "—"}</strong></span><span><b>{copy.adminMigrationNext}</b><strong>{data.migrations.items.find((item) => item.state === "PENDING")?.version ?? "—"}</strong></span></div> : <p className="admin-empty">{copy.adminLaunchNoData}</p>}
      </section>
      <section className="admin-panel" aria-labelledby="launch-editorial-title">
        <div className="admin-section-heading"><h2 id="launch-editorial-title">{copy.adminLaunchPeopleReadiness}</h2><Link href="/admin/people">{copy.adminPeople}</Link></div>
        {data.editorialSample.length === 0 ? <p className="admin-empty">{copy.adminLaunchNoData}</p> : <div className="admin-launch-people-list">{data.editorialSample.map((person) => <Link className="admin-launch-person-row" href={`/admin/people/${person.id}`} key={person.id}><span><strong>{person.nameArabic}</strong><small>{person.name} · {person.slug}</small></span><span><b className={`admin-status admin-status-${person.lifecycle}`}>{contentStatusLabel(person.lifecycle, copy)}</b><small>{personReadinessLabel(person.readiness.state, copy)} · {copy.adminLaunchRequiredFields}: {person.readiness.required.completed}/{person.readiness.required.total} · {copy.adminLaunchRecommendedFields}: {person.readiness.recommended.completed}/{person.readiness.recommended.total}</small></span></Link>)}</div>}
      </section>
      <section className="admin-panel" aria-labelledby="launch-links-title">
        <div className="admin-section-heading"><h2 id="launch-links-title">{copy.adminQuickActions}</h2></div>
        {visibleLinks.length > 0 ? <div className="admin-action-grid">{visibleLinks.map(([href, label]) => <Link className="admin-action-card" href={href} key={href}><strong>{label}</strong><span>{copy.adminLaunchOpen}</span></Link>)}</div> : <p className="admin-empty">{copy.adminReadOnly}</p>}
      </section>
    </div>
  );
}
