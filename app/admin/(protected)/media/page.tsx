import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminMediaPage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminMedia} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail="يعتمد التطبيق على storage provider خارجي وmetadata فقط. لا يوجد fallback إلى filesystem أو تخزين bytes في PostgreSQL." />;
}
