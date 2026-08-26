import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getPublicMessages } from "@/lib/i18n/messages";
import { pageMetadata } from "@/lib/seo/site";

const copy = getPublicMessages(defaultLocale);

export const metadata = pageMetadata(copy.aboutTitle, copy.aboutDescription, "/about");

export default function AboutPage() {
  return <InfoPage copy={copy} title={copy.aboutTitle} description={copy.aboutDescription} />;
}
