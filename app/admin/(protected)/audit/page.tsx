import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Audit · A3LAM", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ actor?: string; action?: string; entityType?: string; entityId?: string; from?: string; to?: string }> };

export default async function AdminAuditPage({ searchParams }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "audit.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  let logs: Awaited<ReturnType<typeof adminRepository.listAuditLogs>> = [];
  let unavailable = false;
  try { logs = await adminRepository.listAuditLogs(params); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminAudit}</h1><p className="route-description">{copy.adminReadOnly}</p></div></header><form className="admin-inline-filter admin-filter-grid" method="get"><label htmlFor="audit-actor">{copy.adminAuditActor}<input id="audit-actor" name="actor" defaultValue={params.actor ?? ""} /></label><label htmlFor="audit-action">{copy.adminAuditAction}<input id="audit-action" name="action" defaultValue={params.action ?? ""} /></label><label htmlFor="audit-entity">{copy.adminAuditEntity}<input id="audit-entity" name="entityType" defaultValue={params.entityType ?? ""} /></label><label htmlFor="audit-entity-id">{copy.adminPermissionCode}<input id="audit-entity-id" name="entityId" dir="ltr" defaultValue={params.entityId ?? ""} /></label><label htmlFor="audit-from">{copy.adminAuditFrom}<input id="audit-from" name="from" type="date" defaultValue={params.from ?? ""} /></label><label htmlFor="audit-to">{copy.adminAuditTo}<input id="audit-to" name="to" type="date" defaultValue={params.to ?? ""} /></label><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button><a className="button button-quiet" href="/admin/audit">{copy.adminClearFilters}</a></form>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}{!logs.length ? <p className="admin-empty">{copy.adminNoAudit}</p> : <section className="admin-panel" aria-label={copy.adminAudit}><div className="admin-audit-list">{logs.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></div><div><span>{log.field}</span><small>{log.actorType}{log.actorId ? ` · ${log.actorId}` : ""} · {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</small></div></article>)}</div></section>}</div>;
}
