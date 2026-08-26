import type { Locale } from "@/lib/i18n/config";

export type PublicErrorMessages = {
  siteName: string;
  siteEyebrow: string;
  searchLoading: string;
  dataUnavailable: string;
  searchError: string;
  retryAction: string;
  notFoundAction: string;
};

const publicErrorMessages: Record<Locale, PublicErrorMessages> = {
  ar: {
    siteName: "أعلام",
    siteEyebrow: "موسوعة عربية · ملفات مهنية",
    searchLoading: "جارٍ البحث في السجلات المنشورة...",
    dataUnavailable: "تعذر الوصول إلى الكتالوج المنشور الآن.",
    searchError: "تعذر تنفيذ البحث الآن. حاول مرة أخرى.",
    retryAction: "المحاولة مرة أخرى",
    notFoundAction: "العودة إلى الرئيسية",
  },
  en: {
    siteName: "A3LAM",
    siteEyebrow: "Arabic encyclopedia · professional profiles",
    searchLoading: "Searching published records...",
    dataUnavailable: "The published catalog is unavailable right now.",
    searchError: "Search is unavailable right now. Try again.",
    retryAction: "Try again",
    notFoundAction: "Return home",
  },
};

export function getPublicErrorMessages(locale: Locale): PublicErrorMessages {
  return publicErrorMessages[locale] ?? publicErrorMessages.ar;
}
