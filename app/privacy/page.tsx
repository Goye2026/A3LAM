import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata = {
  title: "الخصوصية",
  description: "مبادئ الخصوصية وتقليل البيانات في منصة أعلام.",
};

export default function PrivacyPage() {
  const copy = getMessages(defaultLocale);
  return <InfoPage copy={copy} title={copy.privacyTitle} description={copy.privacyDescription} />;
}
