"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminUserManagementSummary } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

export function AdminUserManager({ initialItems, copy, canManage, canRevokeSessions = false }: { initialItems: AdminUserManagementSummary[]; copy: FoundationMessages; canManage: boolean; canRevokeSessions?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function setDisabled(id: string, disabled: boolean) {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, disabled }) });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, accountStatus: disabled ? "disabled" : "active", activeSessions: disabled ? 0 : item.activeSessions } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  async function revokeSessions(id: string) {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, activeSessions: 0 } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel" aria-labelledby="admin-users-list-title"><div className="admin-section-heading"><h2 id="admin-users-list-title">{copy.adminUsers}</h2><span className="admin-readonly-note">{items.length}</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{items.length === 0 ? <p className="admin-empty">{copy.adminNoUsers}</p> : <div className="admin-table-wrap"><table className="admin-table admin-responsive-table"><thead><tr><th>{copy.adminIdentityName}</th><th>{copy.adminIdentityEmail}</th><th>{copy.adminUserStatus}</th><th>{copy.adminProfileStatus}</th><th>{copy.adminVisibility}</th><th>{copy.adminCompletionShort}</th><th>{copy.adminSessions}</th><th>{copy.adminEdit}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td data-label={copy.adminIdentityName}><Link href={`/admin/users/${encodeURIComponent(item.id)}`}>{item.name}</Link></td><td data-label={copy.adminIdentityEmail} dir="ltr">{item.email}</td><td data-label={copy.adminUserStatus}><span className={`admin-status admin-status-${item.accountStatus}`}>{item.accountStatus === "active" ? copy.adminUserActive : copy.adminUserDisabled}</span></td><td data-label={copy.adminProfileStatus}>{item.profileStatus ?? "—"}</td><td data-label={copy.adminVisibility}>{item.visibility ?? "—"}</td><td data-label={copy.adminCompletionShort}>{item.completionPercent === null ? "—" : `${item.completionPercent}%`}</td><td data-label={copy.adminSessions}>{item.activeSessions}</td><td data-label={copy.adminEdit}>{canManage || canRevokeSessions ? <div className="admin-button-row">{canManage ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => void setDisabled(item.id, item.accountStatus === "active")}>{item.accountStatus === "active" ? copy.adminDisable : copy.adminEnable}</button> : null}{canRevokeSessions ? <button className="button button-quiet" type="button" disabled={busy || item.activeSessions === 0} onClick={() => void revokeSessions(item.id)}>{copy.adminRevokeUserSessions}</button> : null}<Link className="button button-quiet" href={`/admin/users/${encodeURIComponent(item.id)}`}>{copy.adminView}</Link></div> : <Link className="button button-quiet" href={`/admin/users/${encodeURIComponent(item.id)}`}>{copy.adminView}</Link>}</td></tr>)}</tbody></table></div>}</section>;
}
