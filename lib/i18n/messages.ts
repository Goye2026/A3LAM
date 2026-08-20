import type { Locale } from "./config";

export type FoundationMessages = {
  brandEyebrow: string;
  brandName: string;
  phaseStatus: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  primaryAction: string;
  secondaryAction: string;
  scopeKicker: string;
  scopeTitle: string;
  scopeDescription: string;
  samplesEyebrow: string;
  samplesTitle: string;
  sampleArabicLabel: string;
  sampleArabicValue: string;
  sampleMixedLabel: string;
  sampleMixedValue: string;
  sampleNumbersLabel: string;
  sampleNumbersValue: string;
  tokensEyebrow: string;
  tokensTitle: string;
  tokenInk: string;
  tokenBrand: string;
  tokenAccent: string;
  footerRtl: string;
  footerNote: string;
};

const ar: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "أساس النظام",
  phaseStatus: "Phase 02 · Foundation",
  heroEyebrow: "Arabic Editorial Knowledge Platform",
  heroTitle: "بنية هادئة لموسوعة موثوقة",
  heroLede:
    "مساحة اختبار محايدة لأساس الاتجاه، الترجمة، الخطوط، المسافات، حالات التركيز، والاستجابة. لا تحتوي هذه الصفحة على بيانات نطاقية.",
  primaryAction: "اختبار الإجراء",
  secondaryAction: "استعراض الرموز",
  scopeKicker: "SCOPE LOCK",
  scopeTitle: "Foundation only",
  scopeDescription: "Domain-neutral · RTL-first · Accessible",
  samplesEyebrow: "Verification surface",
  samplesTitle: "عينات محايدة للتحقق",
  sampleArabicLabel: "العربية RTL",
  sampleArabicValue: "مرحبًا بك في أساس A3LAM",
  sampleMixedLabel: "Mixed Arabic/Latin",
  sampleMixedValue: "A3LAM — موسوعة معرفية",
  sampleNumbersLabel: "Numbers",
  sampleNumbersValue: "2026 · 01 · 22.13.0",
  tokensEyebrow: "Semantic tokens",
  tokensTitle: "لغة بصرية قابلة للتوسع",
  tokenInk: "Ink / النص الأساسي",
  tokenBrand: "Brand / اللون الأساسي",
  tokenAccent: "Accent / التمييز",
  footerRtl: "RTL foundation active",
  footerNote: "© A3LAM · Internal foundation workspace",
};

const en: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "System foundation",
  phaseStatus: "Phase 02 · Foundation",
  heroEyebrow: "Arabic Editorial Knowledge Platform",
  heroTitle: "A calm foundation for trusted knowledge",
  heroLede:
    "A neutral surface for direction, localization, typography, spacing, focus states, and responsiveness. This page contains no domain data.",
  primaryAction: "Test action",
  secondaryAction: "View tokens",
  scopeKicker: "SCOPE LOCK",
  scopeTitle: "Foundation only",
  scopeDescription: "Domain-neutral · RTL-first · Accessible",
  samplesEyebrow: "Verification surface",
  samplesTitle: "Neutral verification samples",
  sampleArabicLabel: "Arabic RTL",
  sampleArabicValue: "Welcome to the A3LAM foundation",
  sampleMixedLabel: "Mixed Arabic/Latin",
  sampleMixedValue: "A3LAM — Knowledge encyclopedia",
  sampleNumbersLabel: "Numbers",
  sampleNumbersValue: "2026 · 01 · 22.13.0",
  tokensEyebrow: "Semantic tokens",
  tokensTitle: "A visual language built to scale",
  tokenInk: "Ink / primary text",
  tokenBrand: "Brand / primary color",
  tokenAccent: "Accent / emphasis",
  footerRtl: "RTL foundation active",
  footerNote: "© A3LAM · Internal foundation workspace",
};

export const messages: Record<Locale, FoundationMessages> = { ar, en };

export function getMessages(locale: Locale): FoundationMessages {
  return messages[locale] ?? messages.ar;
}
