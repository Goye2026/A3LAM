import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { pageCount, parsePositivePage } from "@/lib/admin/pagination";

export const metadata: Metadata = { title: "Audit · A3LAM", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ actor?: string; action?: string; entityType?: string; entityId?: string; from?: string; to?: string; page?: string }> };

function pageHref(params: { actor?: string; action?: string; entityType?: string; entityId?: string; from?: string; to?: string }, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  query.set("page", String(page));
  return `/admin/audit?${query.toString()}`;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "audit.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const params = await searchParams;
  const page = parsePositivePage(params.page);
  const filters = { actor: params.actor?.trim(), action: params.action?.trim(), entityType: params.entityType?.trim(), entityId: params.entityId?.trim(), from: params.from, to: params.to };
  let logs: Awaited<ReturnType<typeof adminRepository.listAuditLogs>> | null = null;
  let unavailable = false;
  try { logs = await adminRepository.listAuditLogs({ ...filters, page, pageSize: 20 }); } catch { unavailable = true; }
  const pages = logs ? pageCount(logs.total, logs.pageSize) : 1;
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminAudit}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header><form className="admin-inline-filter admin-filter-grid" method="get"><label htmlFor="audit-actor">{copy.adminAuditActor}<input id="audit-actor" name="actor" defaultValue={params.actor ?? ""} /></label><label htmlFor="audit-action">{copy.adminAuditAction}<input id="audit-action" name="action" defaultValue={params.action ?? ""} /></label><label htmlFor="audit-entity">{copy.adminAuditEntity}<input id="audit-entity" name="entityType" defaultValue={params.entityType ?? ""} /></label><label htmlFor="audit-entity-id">{copy.adminPermissionCode}<input id="audit-entity-id" name="entityId" dir="ltr" defaultValue={params.entityId ?? ""} /></label><label htmlFor="audit-from">{copy.adminAuditFrom}<input id="audit-from" name="from" type="date" defaultValue={params.from ?? ""} /></label><label htmlFor="audit-to">{copy.adminAuditTo}<input id="audit-to" name="to" type="date" defaultValue={params.to ?? ""} /></label><button className="button button-quiet" type="submit">{copy.adminFilterAction}</button><Link className="button button-quiet" href="/admin/audit">{copy.adminClearFilters}</Link></form>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}{!unavailable && logs?.items.length === 0 ? <p className="admin-empty">{copy.adminNoAudit}</p> : null}{!unavailable && logs && logs.items.length > 0 ? <section className="admin-panel" aria-label={copy.adminAudit}><div className="admin-audit-list">{logs.items.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></div><div><span>{log.field}</span><small>{log.actorType}{log.actorId ? ` · ${log.actorId}` : ""} · {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</small></div></article>)}</div><nav className="admin-pagination" aria-label={copy.adminAudit}><span>{logs.page} / {pages} · {logs.total}</span><div className="admin-button-row">{logs.page > 1 ? <Link className="button button-quiet" href={pageHref(filters, logs.page - 1)}>{copy.adminPagePrevious}</Link> : null}{logs.page < pages ? <Link className="button button-quiet" href={pageHref(filters, logs.page + 1)}>{copy.adminPageNext}</Link> : null}</div></nav></section> : null}</div>;
}
