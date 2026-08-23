import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { pageMetadata } from "@/lib/seo/site";

const copy = getMessages(defaultLocale);

export const metadata = pageMetadata(copy.privacyTitle, copy.privacyDescription, "/privacy");

export default function PrivacyPage() {
  return <InfoPage copy={copy} title={copy.privacyTitle} description={copy.privacyDescription} active="privacy" />;
}
