import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getMigrationPreflight, getMigrationRegistryStatus } from "@/lib/admin/migrationRegistry";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";
import { AdminMigrationControl } from "@/components/a3lam/AdminMigrationControl";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "System · A3LAM", robots: { index: false, follow: false } };

export default async function AdminSystemPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "system.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const [health, registry, preflight, canExecute] = await Promise.all([getSystemHealthSnapshot(), getMigrationRegistryStatus(), getMigrationPreflight(), hasEffectiveAdminPermission(principal, "system.migrations.execute")]);
  const status = (value: string) => value === "available" || value === "ready" ? copy.adminAvailable : value === "requires_configuration" ? copy.adminRequiresConfiguration : value === "requires_migration" ? copy.adminRequiresMigration : value === "requires_schema" ? copy.adminRequiresSchema : copy.adminUnavailable;
  const count = (value: number | null) => value === null ? "—" : String(value);
  const registryStatus = registry.status === "healthy" ? copy.adminMigrationRegistryHealthy : registry.status === "pending" ? copy.adminMigrationRegistryPending : registry.status === "inconsistent" ? copy.adminMigrationRegistryInconsistent : copy.adminMigrationRegistryUnavailable;
  const rowStatus = (value: "APPLIED" | "PENDING" | "UNEXPECTED") => value === "APPLIED" ? copy.adminMigrationApplied : value === "PENDING" ? copy.adminMigrationPending : copy.adminMigrationUnexpected;
  const formatAppliedAt = (value: string | null) => value ? new Intl.DateTimeFormat(defaultLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : copy.adminMigrationNoAppliedAt;
  return <div className="admin-route">
    <header className="admin-route-heading"><div><p className="eyebrow">{copy.adminSystemGroup}</p><h1>{copy.adminSystemHealth}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header>
    <section className="admin-stat-grid">
      <div className="admin-stat-card"><span>{copy.adminDatabaseStatus}</span><strong>{status(health.database)}</strong></div>
      <div className="admin-stat-card"><span>{copy.adminAuthStatus}</span><strong>{status(health.auth)}</strong></div>
      <div className="admin-stat-card"><span>{copy.adminMediaProvider}</span><strong>{status(health.storage)}</strong></div>
      <div className="admin-stat-card"><span>{copy.adminContactEmail}</span><strong>{status(health.email)}</strong></div>
      <div className="admin-stat-card"><span>{copy.adminSettings}</span><strong>{status(health.configuration)}</strong></div>
      <div className="admin-stat-card"><span>{copy.adminMigrationStatus}</span><strong>{status(health.migrations.status)}</strong><small>{copy.adminAppliedMigrations}: {count(health.migrations.applied)} · {copy.adminPendingMigrations}: {count(health.migrations.pending)}</small></div>
      <div className="admin-stat-card"><span>{copy.adminSiteExperienceStatus}</span><strong>{status(health.siteExperience.status)}</strong><small>{copy.adminPublishedResources}: {count(health.siteExperience.published)} · {copy.adminDraftResources}: {count(health.siteExperience.drafts)}</small></div>
      <div className="admin-stat-card"><span>{copy.adminMedia}</span><strong>{health.mediaFiles === null ? "—" : health.mediaFiles}</strong></div>
    </section>
    <section className="admin-panel" aria-labelledby="migration-registry-heading">
      <header className="admin-panel-heading"><div><h2 id="migration-registry-heading">{copy.adminMigrationRegistryTitle}</h2><p className="route-description">{copy.adminMigrationRegistryDescription}</p></div><span className={`status-badge status-${registry.status}`} role="status">{registryStatus}</span></header>
      {registry.status === "unavailable" ? <p className="admin-alert" role="alert">{copy.adminMigrationRegistryUnavailable}</p> : <>
        <div className="admin-stat-grid admin-stat-grid-compact" aria-label={copy.adminMigrationRegistryTitle}>
          <div className="admin-stat-card"><span>{copy.adminAppliedMigrations}</span><strong>{registry.appliedCount}</strong></div>
          <div className="admin-stat-card"><span>{copy.adminPendingMigrations}</span><strong>{registry.pendingCount}</strong></div>
          <div className="admin-stat-card"><span>{copy.adminExpectedMigrations}</span><strong>{registry.expectedCount}</strong></div>
        </div>
        <div className="admin-table-wrap"><table className="admin-table"><caption className="sr-only">{copy.adminMigrationRegistryTitle}</caption><thead><tr><th scope="col">{copy.adminMigrationVersion}</th><th scope="col">{copy.adminMigrationRowStatus}</th><th scope="col">{copy.adminMigrationAppliedAt}</th></tr></thead><tbody>{registry.items.map((item) => <tr key={`${item.source}:${item.version}`}><th scope="row" dir="ltr">{item.version}</th><td><span className={`status-badge status-${item.state.toLowerCase()}`}>{rowStatus(item.state)}</span></td><td dir="ltr">{formatAppliedAt(item.appliedAt)}</td></tr>)}</tbody></table></div>
      </>}
    </section>
    <AdminMigrationControl initialPreflight={preflight} canExecute={canExecute} copy={copy} />
    <p className="admin-field-hint">{copy.adminRequiresConfiguration}: {copy.adminCredentialLifecycleDeferred}</p>
  </div>;
}
