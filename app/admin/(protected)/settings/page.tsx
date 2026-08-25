import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminSettingsPage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminSettings} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail="لن تتحول قاعدة البيانات إلى JSON dumping ground؛ أي إعدادات دائمة ستُصمم كنموذج typed مع validation ونسخة draft/preview عند اعتماد schema." />;
}
