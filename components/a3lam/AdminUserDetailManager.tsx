"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminUserDetail } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

function formatDate(value: string, locale = "ar") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminUserDetailManager({ initialItem, copy, canManage, canRevokeSessions = false }: { initialItem: AdminUserDetail; copy: FoundationMessages; canManage: boolean; canRevokeSessions?: boolean }) {
  const [item, setItem] = useState(initialItem);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function updateStatus(disabled: boolean) {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, disabled }) });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItem((current) => ({ ...current, accountStatus: disabled ? "disabled" : "active", sessions: disabled ? [] : current.sessions }));
      setNotice(disabled ? copy.adminSuspendUser : copy.adminReactivateUser);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  async function revokeSessions() {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItem((current) => ({ ...current, sessions: [] }));
      setNotice(copy.adminRevokeAllSessions);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  return <div className="admin-detail-stack">
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    {notice ? <p className="admin-success" role="status" aria-live="polite">{notice}</p> : null}
    <section className="admin-panel" aria-labelledby="admin-user-overview-title">
      <div className="admin-section-heading"><h2 id="admin-user-overview-title">{copy.adminAccountOverview}</h2><span className={`admin-status admin-status-${item.accountStatus}`}>{item.accountStatus === "active" ? copy.adminUserActive : copy.adminUserDisabled}</span></div>
      <dl className="admin-detail-list"><div><dt>{copy.adminIdentityName}</dt><dd>{item.name}</dd></div><div><dt>{copy.adminIdentityEmail}</dt><dd dir="ltr">{item.email}</dd></div><div><dt>{copy.adminCreated}</dt><dd>{formatDate(item.createdAt)}</dd></div><div><dt>{copy.adminUpdated}</dt><dd>{item.lastSignedIn ? formatDate(item.lastSignedIn) : "—"}</dd></div></dl>
      {canManage || canRevokeSessions ? <div className="admin-button-row">{canManage ? (item.accountStatus === "active" ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => void updateStatus(true)}>{copy.adminSuspendUser}</button> : <button className="button button-secondary" type="button" disabled={busy} onClick={() => void updateStatus(false)}>{copy.adminReactivateUser}</button>) : null}{canRevokeSessions ? <button className="button button-quiet" type="button" disabled={busy || item.sessions.length === 0} onClick={() => void revokeSessions()}>{copy.adminRevokeAllSessions}</button> : null}</div> : null}
    </section>
    <section className="admin-panel" aria-labelledby="admin-user-profile-title"><h2 id="admin-user-profile-title">{copy.adminProfileOverview}</h2>{item.profile ? <><dl className="admin-detail-list"><div><dt>{copy.adminArabicName}</dt><dd>{item.profile.nameArabic}</dd></div><div><dt>{copy.adminEnglishName}</dt><dd>{item.profile.name}</dd></div><div><dt>{copy.adminSlug}</dt><dd dir="ltr">{item.profile.slug}</dd></div><div><dt>{copy.adminStatusLabel}</dt><dd>{item.profile.status} · {item.profile.visibility}</dd></div></dl><p className="admin-progress-label"><span>{copy.adminCompletion}</span><strong>{item.profile.completion.percent}%</strong></p><div className="completion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.profile.completion.percent} aria-label={copy.adminCompletion}><span style={{ width: `${item.profile.completion.percent}%` }} /></div><Link className="button button-quiet" href={`/admin/profiles/${encodeURIComponent(item.profile.id)}`}>{copy.adminView}</Link></> : <p className="admin-empty">{copy.adminNoUsers}</p>}</section>
    <section className="admin-panel" aria-labelledby="admin-user-sessions-title"><div className="admin-section-heading"><h2 id="admin-user-sessions-title">{copy.adminActiveSessions}</h2><span className="admin-readonly-note">{item.sessions.length}</span></div>{item.sessions.length ? <div className="admin-table-wrap"><table className="admin-table admin-responsive-table"><thead><tr><th>{copy.adminOpaqueSessionId}</th><th>{copy.adminUpdated}</th><th>{copy.adminSessionExpires}</th></tr></thead><tbody>{item.sessions.map((session) => <tr key={session.id}><td data-label={copy.adminOpaqueSessionId} dir="ltr"><span title={session.id}>{session.id.slice(0, 8)}…</span></td><td data-label={copy.adminCreated}>{formatDate(session.createdAt)}</td><td data-label={copy.adminSessionExpires}>{formatDate(session.expiresAt)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">{copy.adminNoSessions}</p>}</section>
    <section className="admin-panel" aria-labelledby="admin-user-audit-title"><div className="admin-section-heading"><h2 id="admin-user-audit-title">{copy.adminAuditEvents}</h2><span className="admin-readonly-note">{item.audit.length}</span></div>{item.audit.length ? <div className="admin-audit-list">{item.audit.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.field}</small></div><small>{formatDate(log.createdAt)}</small></article>)}</div> : <p className="admin-empty">{copy.adminNoAudit}</p>}</section>
    <section className="admin-panel" aria-labelledby="admin-user-security-title"><h2 id="admin-user-security-title">{copy.adminSecurity}</h2><p>{copy.adminCredentialBoundary}</p><p className="admin-readonly-note">{copy.adminCredentialLifecycleDeferred}</p></section>
  </div>;
}
