"use client";

import { useMemo, useState } from "react";
import type { AdminEffectivePermissions, AdminIdentitySummary, AdminPermissionCode, AdminPermissionOverrideSummary } from "@/lib/admin/types";
import type { FoundationMessages } from "@/lib/i18n/messages";

const roleLabel = (role: AdminIdentitySummary["role"], copy: FoundationMessages) => role === "SUPER_ADMIN" ? copy.adminRoleSuperAdmin : role === "ADMIN" ? copy.adminRoleAdmin : role === "EDITOR" ? copy.adminRoleEditor : role === "MODERATOR" ? copy.adminRoleModerator : "—";

export function AdminPermissionManager({ identities, permissions, initialItem, copy, canEdit }: { identities: AdminIdentitySummary[]; permissions: AdminPermissionCode[]; initialItem: AdminEffectivePermissions | null; copy: FoundationMessages; canEdit: boolean }) {
  const [selectedId, setSelectedId] = useState(initialItem?.adminId ?? identities[0]?.id ?? "");
  const [item, setItem] = useState(initialItem);
  const [overrides, setOverrides] = useState<Record<string, "allow" | "deny" | "">>(() => Object.fromEntries((initialItem?.overrides ?? []).map((override) => [override.permissionCode, override.effect])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = useMemo(() => identities.find((identity) => identity.id === selectedId) ?? null, [identities, selectedId]);

  async function loadIdentity(id: string) {
    setSelectedId(id); setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/admin/administrators/${encodeURIComponent(id)}/permissions`);
      const payload = await response.json() as { item?: AdminEffectivePermissions; message?: string };
      if (!response.ok || !payload.item) throw new Error(payload.message ?? copy.adminDatabaseError);
      setItem(payload.item);
      setOverrides(Object.fromEntries(payload.item.overrides.map((override: AdminPermissionOverrideSummary) => [override.permissionCode, override.effect])));
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!item || !canEdit || !window.confirm(copy.adminConfirmationNeeded)) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/admin/administrators/${encodeURIComponent(item.adminId)}/permissions`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ overrides: Object.entries(overrides).filter(([, effect]) => effect).map(([permissionCode, effect]) => ({ permissionCode, effect })) }) });
      const payload = await response.json() as { item?: AdminEffectivePermissions; message?: string };
      if (!response.ok || !payload.item) throw new Error(payload.message ?? copy.adminConflictError);
      setItem(payload.item);
      setOverrides(Object.fromEntries(payload.item.overrides.map((override) => [override.permissionCode, override.effect])));
      setNotice(copy.adminPermissionSaved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : copy.adminDatabaseError); }
    finally { setBusy(false); }
  }

  return <section className="admin-panel" aria-labelledby="permission-management-title"><div className="admin-section-heading"><h2 id="permission-management-title">{copy.adminPermissionOverrides}</h2><span className="admin-readonly-note">{canEdit ? copy.adminRoleSuperAdmin : copy.adminReadOnly}</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{notice ? <p className="admin-success" role="status" aria-live="polite">{notice}</p> : null}{identities.length === 0 ? <p className="admin-empty">{copy.adminNoAdminIdentities}</p> : <><label className="admin-field" htmlFor="permission-admin-select">{copy.adminIdentityName}<select id="permission-admin-select" value={selectedId} disabled={busy} onChange={(event) => void loadIdentity(event.target.value)}>{identities.map((identity) => <option key={identity.id} value={identity.id}>{identity.displayName} · {roleLabel(identity.role, copy)}</option>)}</select></label>{selected && item ? <><p className="route-description">{selected.email} · {roleLabel(item.role, copy)}</p><div className="admin-permission-summary"><div><h3>{copy.adminDefaultPermissions}</h3><p dir="ltr">{item.defaults.length ? item.defaults.join(", ") : "—"}</p></div><div><h3>{copy.adminEffectivePermissions}</h3><p dir="ltr">{item.effective.length ? item.effective.join(", ") : "—"}</p></div></div><div className="admin-table-wrap"><table className="admin-table admin-responsive-table"><thead><tr><th>{copy.adminPermissionCode}</th><th>{copy.adminDefaultPermissions}</th><th>{copy.adminPermissionOverrides}</th><th>{copy.adminEffectivePermissions}</th></tr></thead><tbody>{permissions.map((permission) => { const override = overrides[permission] ?? ""; return <tr key={permission}><th data-label={copy.adminPermissionCode} dir="ltr">{permission}</th><td data-label={copy.adminDefaultPermissions}>{item.defaults.includes(permission) ? "✓" : "—"}</td><td data-label={copy.adminPermissionOverrides}>{canEdit ? <select value={override} disabled={busy} aria-label={`${permission} ${copy.adminPermissionOverrides}`} onChange={(event) => setOverrides((current) => ({ ...current, [permission]: event.target.value as "allow" | "deny" | "" }))}><option value="">—</option><option value="allow">{copy.adminPermissionAllow}</option><option value="deny">{copy.adminPermissionDeny}</option></select> : override === "allow" ? copy.adminPermissionAllow : override === "deny" ? copy.adminPermissionDeny : "—"}</td><td data-label={copy.adminEffectivePermissions}>{item.effective.includes(permission) ? "✓" : "—"}</td></tr>; })}</tbody></table></div>{canEdit ? <button className="button button-primary" type="button" disabled={busy} onClick={() => void save()}>{copy.adminSavePermissions}</button> : <p className="admin-readonly-note">{copy.adminPermissionConfiguration}</p>}</> : null}</>}</section>;
}
