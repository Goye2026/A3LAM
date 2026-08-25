"use client";

import { FormEvent, useState } from "react";
import type { AdminIdentitySummary, AdminRoleCode } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

const roles: AdminRoleCode[] = ["ADMIN", "EDITOR", "MODERATOR", "SUPER_ADMIN"];

function roleLabel(role: AdminRoleCode, copy: FoundationMessages) {
  return role === "SUPER_ADMIN" ? copy.adminRoleSuperAdmin : role === "ADMIN" ? copy.adminRoleAdmin : role === "EDITOR" ? copy.adminRoleEditor : copy.adminRoleModerator;
}

function statusLabel(status: AdminIdentitySummary["status"], copy: FoundationMessages) {
  return status === "invited" ? copy.adminStatusInvited : status === "active" ? copy.adminStatusActive : copy.adminStatusDisabled;
}

export function AdminIdentityManager({ initialItems, copy, editorsOnly = false, canManage = false }: { initialItems: AdminIdentitySummary[]; copy: FoundationMessages; editorsOnly?: boolean; canManage?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRoleCode>(editorsOnly ? "EDITOR" : "ADMIN");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/administrators", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, displayName, role }) });
      const payload = await response.json() as { item?: AdminIdentitySummary; message?: string };
      if (!response.ok || !payload.item) throw new Error(payload.message ?? copy.adminConflictError);
      setItems((current) => [payload.item!, ...current]);
      setEmail(""); setDisplayName(""); setMessage(copy.adminIdentityRequiresActivation);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  async function update(id: string, patch: { role?: AdminRoleCode; status?: "active" | "disabled" }) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`/api/admin/administrators/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
      const payload = await response.json() as { item?: { id: string; role: AdminRoleCode | null; status: AdminIdentitySummary["status"] }; message?: string };
      if (!response.ok || !payload.item) throw new Error(payload.message ?? copy.adminConflictError);
      setItems((current) => current.map((item) => item.id === id ? { ...item, role: payload.item!.role, status: payload.item!.status } : item));
      setMessage(copy.adminSaved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  return <div className="admin-stack">
    {canManage ? <form className="admin-panel admin-form-grid" onSubmit={create}>
      <div className="admin-section-heading"><div><h2>{copy.adminCreateIdentity}</h2><p className="route-description">{copy.adminIdentityRequiresActivation}</p></div></div>
      <label>{copy.adminIdentityName}<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={160} /></label>
      <label>{copy.adminIdentityEmail}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320} /></label>
      <label>{copy.adminRole}<select value={role} onChange={(event) => setRole(event.target.value as AdminRoleCode)}>{roles.filter((value) => !editorsOnly || value === "EDITOR").map((value) => <option key={value} value={value}>{roleLabel(value, copy)}</option>)}</select></label>
      <div><button className="button button-primary" disabled={busy}>{busy ? copy.adminSaving : copy.adminCreateIdentity}</button></div>
    </form> : null}
    {message ? <p className="admin-success" role="status">{message}</p> : null}
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    <section className="admin-panel" aria-labelledby="admin-identities-list-title">
      <div className="admin-section-heading"><h2 id="admin-identities-list-title">{editorsOnly ? copy.adminEditors : copy.adminAdministrators}</h2><span className="admin-readonly-note">{items.length}</span></div>
      {items.length === 0 ? <p className="admin-empty">{editorsOnly ? copy.adminNoEditors : copy.adminNoAdminIdentities}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{copy.adminIdentityName}</th><th>{copy.adminIdentityEmail}</th><th>{copy.adminRole}</th><th>{copy.adminIdentityStatus}</th><th>{copy.adminSessions}</th><th>{copy.adminEdit}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.displayName}</td><td dir="ltr">{item.email}</td><td><select aria-label={`${copy.adminChangeRole}: ${item.displayName}`} value={item.role ?? ""} disabled={!item.role || busy || !canManage} onChange={(event) => void update(item.id, { role: event.target.value as AdminRoleCode })}>{item.role ? roles.map((value) => <option key={value} value={value}>{roleLabel(value, copy)}</option>) : <option value="">—</option>}</select></td><td><span className={`admin-status admin-status-${item.status}`}>{statusLabel(item.status, copy)}</span></td><td>{item.activeSessions}</td><td>{item.status === "active" && canManage ? <button className="button button-secondary" disabled={busy} onClick={() => void update(item.id, { status: "disabled" })}>{copy.adminDisable}</button> : <span className="admin-readonly-note">{item.status === "active" ? copy.adminReadOnly : copy.adminIdentityRequiresActivation}</span>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
