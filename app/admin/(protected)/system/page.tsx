import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { adminRepository } from "@/lib/data/adminRepository";

export default async function AdminSystemPage() {
  const copy = getMessages(defaultLocale);
  const status = await adminRepository.getSystemStatus();
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminSystemGroup}</p><h1>{copy.adminSystem}</h1><p className="route-description">حالة تشغيلية مختصرة دون أسرار أو تفاصيل اتصال حساسة.</p></div></header><section className="admin-panel admin-system-status" aria-labelledby="admin-system-status-title"><p className="eyebrow">{copy.adminSystem}</p><h2 id="admin-system-status-title">{copy.adminDatabaseStatus}</h2><strong className={status.database === "available" ? "admin-system-available" : "admin-system-unavailable"}>{status.database === "available" ? copy.adminAvailable : copy.adminUnavailable}</strong><p className="section-help">{status.database === "available" ? "تمكن التطبيق من تنفيذ فحص اتصال محدود." : copy.adminDatabaseError}</p></section></div>;
}
