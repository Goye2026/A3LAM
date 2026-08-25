import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminSeoPage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminSeo} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail="ستقتصر إعدادات SEO على metadata منظمة ومتحققة؛ لا تُقبل scripts أو HTML غير آمن." />;
}
