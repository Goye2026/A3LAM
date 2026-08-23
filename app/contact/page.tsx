import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata = {
  title: "تواصل مع أعلام",
  description: "معلومات التواصل التحريري مع منصة أعلام.",
};

export default function ContactPage() {
  const copy = getMessages(defaultLocale);
  return <InfoPage copy={copy} title={copy.contactTitle} description={copy.contactDescription} />;
}
