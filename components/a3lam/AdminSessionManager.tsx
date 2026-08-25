"use client";

import { useState } from "react";
import type { AdminSessionSummary } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

export function AdminSessionManager({ initialItems, copy }: { initialItems: AdminSessionSummary[]; copy: FoundationMessages }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function revoke(id: string) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(copy.adminConflictError);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel" aria-labelledby="admin-session-list-title"><div className="admin-section-heading"><h2 id="admin-session-list-title">{copy.adminSessions}</h2><span className="admin-readonly-note">{items.length}</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{items.length === 0 ? <p className="admin-empty">{copy.adminNoSessions}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{copy.adminIdentityName}</th><th>{copy.adminSessionDevice}</th><th>{copy.adminSessionAddress}</th><th>{copy.adminSessionExpires}</th><th>{copy.adminRevoke}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.adminName}</td><td>{item.userAgent ?? "—"}</td><td dir="ltr">{item.ipAddress ?? "—"}</td><td dir="ltr">{new Date(item.expiresAt).toLocaleString("ar")}</td><td><button className="button button-secondary" disabled={busy} onClick={() => void revoke(item.id)}>{copy.adminRevoke}</button></td></tr>)}</tbody></table></div>}</section>;
}
