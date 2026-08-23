import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { pageMetadata } from "@/lib/seo/site";

const copy = getMessages(defaultLocale);

export const metadata = pageMetadata(copy.contactTitle, copy.contactDescription, "/contact");

export default function ContactPage() {
  return <InfoPage copy={copy} title={copy.contactTitle} description={copy.contactDescription} active="contact" />;
}
