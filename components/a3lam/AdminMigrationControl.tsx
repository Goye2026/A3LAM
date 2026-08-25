"use client";

import { useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { MigrationPreflight } from "@/lib/admin/migrationRegistry";
import { MIGRATION_EXECUTION_CONFIRMATION } from "@/lib/admin/migrationExecution";

function statusLabel(value: "available" | "unavailable" | "consistent" | "inconsistent" | "eligible" | "blocked", copy: FoundationMessages) {
  if (value === "available" || value === "consistent" || value === "eligible") return copy.adminAvailable;
  if (value === "inconsistent") return copy.adminMigrationRegistryInconsistent;
  if (value === "blocked") return copy.adminMigrationBlocked;
  return copy.adminUnavailable;
}

function reasonLabel(reason: MigrationPreflight["reason"], copy: FoundationMessages) {
  if (reason === "PREREQUISITE_MISSING") return copy.adminMigrationPrerequisiteMissing;
  if (reason === "NO_PENDING_MIGRATION") return copy.adminMigrationNoPending;
  if (reason === "REGISTRY_INCONSISTENT") return copy.adminMigrationRegistryInconsistent;
  if (reason === "REGISTRY_UNAVAILABLE") return copy.adminMigrationRegistryUnavailable;
  if (reason === "MIGRATION_FILES_UNAVAILABLE") return copy.adminMigrationRegistryUnavailable;
  if (reason === "DATABASE_UNAVAILABLE") return copy.adminDatabaseError;
  return null;
}

export function AdminMigrationControl({ initialPreflight, canExecute, copy }: { initialPreflight: MigrationPreflight; canExecute: boolean; copy: FoundationMessages }) {
  const [preflight, setPreflight] = useState(initialPreflight);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function execute() {
    if (!canExecute || !confirmed || preflight.execution !== "eligible" || !preflight.nextMigration || busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/system/migrations/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: MIGRATION_EXECUTION_CONFIRMATION }) });
      const payload = await response.json() as { preflight?: MigrationPreflight; message?: string; execution?: string };
      if (payload.preflight) setPreflight(payload.preflight);
      if (!response.ok || payload.execution !== "APPLIED") throw new Error(payload.message ?? copy.adminMigrationFailure);
      setConfirmed(false);
      setNotice(copy.adminMigrationSuccess);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.adminMigrationFailure);
    } finally { setBusy(false); }
  }

  const reason = reasonLabel(preflight.reason, copy);
  return <section className="admin-panel" aria-labelledby="migration-control-heading">
    <header className="admin-panel-heading"><div><h2 id="migration-control-heading">{copy.adminMigrationControlTitle}</h2><p className="route-description">{copy.adminMigrationControlDescription}</p></div><span className={`status-badge status-${preflight.execution}`}>{statusLabel(preflight.execution, copy)}</span></header>
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    {notice ? <p className="admin-success" role="status" aria-live="polite">{notice}</p> : null}
    <div className="admin-status-summary">
      <div><span>{copy.adminMigrationDatabase}</span><strong>{statusLabel(preflight.database, copy)}</strong></div>
      <div><span>{copy.adminMigrationRegistry}</span><strong>{statusLabel(preflight.registry, copy)}</strong></div>
      <div><span>{copy.adminMigrationAuthorization}</span><strong>{canExecute ? copy.adminMigrationAuthorized : copy.adminMigrationNotAuthorized}</strong></div>
      <div><span>{copy.adminMigrationNext}</span><strong dir="ltr">{preflight.nextMigration ?? "—"}</strong></div>
    </div>
    <div className="admin-migration-prerequisites"><h3>{copy.adminMigrationPrerequisites}</h3><ul>{preflight.prerequisites.map((item) => <li key={item.version} dir="ltr"><span>{item.applied ? "✓" : "—"}</span> {item.version}</li>)}</ul></div>
    {reason ? <p className="admin-alert" role="status">{reason}</p> : null}
    {canExecute && preflight.execution === "eligible" && preflight.nextMigration ? <div className="admin-migration-execution"><label><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} /> {copy.adminMigrationConfirmPrompt}</label><button className="button button-primary" type="button" disabled={!confirmed || busy} onClick={() => void execute()}>{busy ? copy.adminMigrationExecution : copy.adminMigrationExecuteButton}</button></div> : <p className="admin-readonly-note">{canExecute ? copy.adminMigrationBlocked : copy.adminMigrationNotAuthorized}</p>}
  </section>;
}
