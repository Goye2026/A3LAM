import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminAdministratorsPage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminAdministrators} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail={copy.adminUnavailableDescription} />;
}
