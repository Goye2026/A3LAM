import { AdminStatusPage } from "@/components/a3lam/AdminStatusPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminHomepagePage() {
  const copy = getMessages(defaultLocale);
  return <AdminStatusPage title={copy.adminHomepage} description={copy.adminControlCenterDescription} status={copy.adminRequiresSchema} detail="سيُبنى لاحقًا كمحرر أقسام typed مع Draft/Preview/Publish، وليس كـvisual builder مفتوح." />;
}
