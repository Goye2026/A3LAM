import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "System · A3LAM", robots: { index: false, follow: false } };

export default async function AdminSystemPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "system.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const health = await getSystemHealthSnapshot();
  const status = (value: string) => value === "available" || value === "ready" ? copy.adminAvailable : value === "requires_configuration" ? copy.adminRequiresConfiguration : value === "requires_migration" ? copy.adminRequiresMigration : value === "requires_schema" ? copy.adminRequiresSchema : copy.adminUnavailable;
  const count = (value: number | null) => value === null ? "—" : String(value);
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
    <p className="admin-field-hint">{copy.adminRequiresConfiguration}: {copy.adminCredentialLifecycleDeferred}</p>
  </div>;
}
