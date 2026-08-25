"use client";

import { useState } from "react";
import type { AdminUserManagementSummary } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

export function AdminUserManager({ initialItems, copy }: { initialItems: AdminUserManagementSummary[]; copy: FoundationMessages }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function setDisabled(id: string, disabled: boolean) {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, disabled }) });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, accountStatus: disabled ? "disabled" : "active", activeSessions: disabled ? 0 : item.activeSessions } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  async function revokeSessions(id: string) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, activeSessions: 0 } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel" aria-labelledby="admin-users-list-title"><div className="admin-section-heading"><h2 id="admin-users-list-title">{copy.adminUsers}</h2><span className="admin-readonly-note">{items.length}</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{items.length === 0 ? <p className="admin-empty">{copy.adminNoUsers}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{copy.adminIdentityName}</th><th>{copy.adminIdentityEmail}</th><th>{copy.adminUserStatus}</th><th>{copy.adminProfiles}</th><th>{copy.adminSessions}</th><th>{copy.adminEdit}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td><td dir="ltr">{item.email}</td><td><span className={`admin-status admin-status-${item.accountStatus}`}>{item.accountStatus === "active" ? copy.adminUserActive : copy.adminUserDisabled}</span></td><td>{item.profile?.nameArabic ?? "—"}</td><td>{item.activeSessions}</td><td><div className="admin-button-row"><button className="button button-secondary" disabled={busy} onClick={() => void setDisabled(item.id, item.accountStatus === "active")}>{item.accountStatus === "active" ? copy.adminDisable : copy.adminEnable}</button><button className="button button-quiet" disabled={busy || item.activeSessions === 0} onClick={() => void revokeSessions(item.id)}>{copy.adminRevokeUserSessions}</button></div></td></tr>)}</tbody></table></div>}</section>;
}
