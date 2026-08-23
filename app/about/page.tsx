import { InfoPage } from "@/components/a3lam/InfoPage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata = {
  title: "عن أعلام",
  description: "تعرف على رؤية أعلام ومبدأ بناء المعرفة العربية بمصادر واضحة.",
};

export default function AboutPage() {
  const copy = getMessages(defaultLocale);
  return <InfoPage copy={copy} title={copy.aboutTitle} description={copy.aboutDescription} />;
}
