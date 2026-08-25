import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminAppearancePage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminAppearance} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail="أي تحكم مستقبلي سيستخدم design tokens مقيدة فقط؛ لا يُسمح بتخزين CSS أو JavaScript تنفيذي." />;
}
