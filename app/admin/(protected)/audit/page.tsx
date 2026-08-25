import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";

export default async function AdminAuditPage() {
  const copy = getMessages(defaultLocale);
  let logs: Awaited<ReturnType<typeof adminRepository.listAuditLogs>> = [];
  let unavailable = false;
  try {
    logs = await adminRepository.listAuditLogs();
  } catch {
    unavailable = true;
  }
  return (
    <div className="admin-route">
      <header className="admin-route-heading"><div><p className="eyebrow">{copy.adminOperationsGroup}</p><h1>{copy.adminAudit}</h1><p className="route-description">سجل read-only للعمليات المسجلة في النظام، مع إخفاء قيم الحقول الحساسة.</p></div></header>
      {unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : null}
      {!logs.length ? <p className="admin-empty">لا توجد أحداث تدقيق متاحة في النطاق الحالي.</p> : <section className="admin-panel" aria-label={copy.adminAudit}><div className="admin-audit-list">{logs.map((log) => <article className="admin-audit-row" key={log.id}><div><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></div><div><span>{log.field}</span><small>{log.actorType} · {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</small></div></article>)}</div></section>}
    </div>
  );
}
