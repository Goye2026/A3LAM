"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminSessionSummary } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

export function AdminSessionManager({ initialItems, copy, canRevoke }: { initialItems: AdminSessionSummary[]; copy: FoundationMessages; canRevoke: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function revoke(id: string) {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  async function revokeAll(adminId: string) {
    if (!window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/sessions?adminId=${encodeURIComponent(adminId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.filter((item) => item.adminId !== adminId));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel" aria-labelledby="admin-session-list-title"><div className="admin-section-heading"><h2 id="admin-session-list-title">{copy.adminSessions}</h2><span className="admin-readonly-note">{items.length}</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{items.length === 0 ? <p className="admin-empty">{copy.adminNoSessions}</p> : <div className="admin-table-wrap"><table className="admin-table admin-responsive-table"><thead><tr><th>{copy.adminIdentityName}</th><th>{copy.adminSessionStatus}</th><th>{copy.adminSessionDevice}</th><th>{copy.adminSessionAddress}</th><th>{copy.adminUpdated}</th><th>{copy.adminSessionExpires}</th><th>{copy.adminRevoke}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td data-label={copy.adminIdentityName}><Link href={`/admin/permissions?adminId=${encodeURIComponent(item.adminId)}`}>{item.adminName}</Link></td><td data-label={copy.adminSessionStatus}>{item.status === "active" ? copy.adminSessionActive : item.status === "revoked" ? copy.adminSessionRevoked : copy.adminSessionExpired}</td><td data-label={copy.adminSessionDevice}>{item.userAgent ?? "—"}</td><td data-label={copy.adminSessionAddress} dir="ltr">{item.ipAddress ?? "—"}</td><td data-label={copy.adminUpdated} dir="ltr">{new Date(item.lastActivityAt).toLocaleString("ar")}</td><td data-label={copy.adminSessionExpires} dir="ltr">{new Date(item.expiresAt).toLocaleString("ar")}</td><td data-label={copy.adminRevoke}>{canRevoke ? <div className="admin-button-row"><button className="button button-secondary" type="button" disabled={busy} onClick={() => void revoke(item.id)}>{copy.adminRevoke}</button><button className="button button-quiet" type="button" disabled={busy} onClick={() => void revokeAll(item.adminId)}>{copy.adminRevokeAllSessions}</button></div> : <span className="admin-readonly-note">{copy.adminReadOnly}</span>}</td></tr>)}</tbody></table></div>}</section>;
}
