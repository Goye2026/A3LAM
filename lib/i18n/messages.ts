import type { Locale } from "./config";

export type FoundationMessages = {
  brandEyebrow: string;
  brandName: string;
  siteEyebrow: string;
  siteName: string;
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
  navHome: string;
  navPeople: string;
  navCategories: string;
  navAbout: string;
  navSearch: string;
  menuLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchAction: string;
  searchHint: string;
  searchResults: string;
  searchEmpty: string;
  searchLoading: string;
  searchError: string;
  searchFilterLabel: string;
  searchAllCategories: string;
  searchPageTitle: string;
  searchPageDescription: string;
  searchPageBack: string;
  clearSearch: string;
  closeSearch: string;
  heroCta: string;
  heroSecondary: string;
  statsPeople: string;
  statsPublishedPeople: string;
  statsCategories: string;
  statsCountries: string;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;
  featuredEmpty: string;
  dataUnavailable: string;
  viewAll: string;
  profileStatus: string;
  profileStatusNote: string;
  publishedProfileStatus: string;
  samplePersonOneName: string;
  samplePersonOneRole: string;
  samplePersonOneMeta: string;
  samplePersonTwoName: string;
  samplePersonTwoRole: string;
  samplePersonTwoMeta: string;
  samplePersonThreeName: string;
  samplePersonThreeRole: string;
  samplePersonThreeMeta: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesDescription: string;
  categoriesPageTitle: string;
  categoriesPageDescription: string;
  categoryResults: string;
  categoryNoPeople: string;
  categoryMedia: string;
  categoryAcademia: string;
  categoryCulture: string;
  categoryBusiness: string;
  categorySociety: string;
  categorySports: string;
  categoryScience: string;
  categoryCountSuffix: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaAction: string;
  footerTagline: string;
  footerExplore: string;
  footerContribute: string;
  footerAbout: string;
  footerContact: string;
  footerPrivacy: string;
  footerRights: string;
  demoLabel: string;
  demoDataNote: string;
  publishedDataNote: string;
  profileView: string;
  profileOverview: string;
  profileFacts: string;
  profileOccupation: string;
  profileCategories: string;
  profileRecordId: string;
  profileLastUpdated: string;
  profileNoBiography: string;
  profileNoTimeline: string;
  profileNoEducation: string;
  profileNoSources: string;
  profileRelatedCategories: string;
  profileRelatedPeople: string;
  profileSourceAccess: string;
  personPageTitle: string;
  personPageLede: string;
  backToDirectory: string;
  timelineLabel: string;
  educationLabel: string;
  sourcesLabel: string;
  notPublished: string;
  notFoundEyebrow: string;
  notFoundTitle: string;
  notFoundDescription: string;
  notFoundAction: string;
  aboutTitle: string;
  aboutDescription: string;
  contactTitle: string;
  contactDescription: string;
  privacyTitle: string;
  privacyDescription: string;
};

const ar: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "أساس النظام",
  siteEyebrow: "موسوعة الشخصيات العربية",
  siteName: "أعلام",
  phaseStatus: "منصة معرفية موثوقة",
  heroEyebrow: "اكتشف أثر الشخصيات العربية",
  heroTitle: "الأثر يبدأ من سيرةٍ موثقة",
  heroLede:
    "أعلام مساحة عربية لاكتشاف الشخصيات التي صنعت فرقًا في الإعلام، والعلوم، والثقافة، والمجتمع. نرتب المعرفة بوضوح، ونربط كل معلومة بمصدرها.",
  primaryAction: "استكشف الشخصيات",
  secondaryAction: "تصفح التصنيفات",
  scopeKicker: "مبدأ التحرير",
  scopeTitle: "الدقة قبل الكثرة",
  scopeDescription: "ملفات منظمة · مصادر واضحة · مراجعة بشرية",
  samplesEyebrow: "عينات الأساس",
  samplesTitle: "لغة بصرية قابلة للتوسع",
  sampleArabicLabel: "العربية RTL",
  sampleArabicValue: "مرحبًا بك في أساس أعلام",
  sampleMixedLabel: "Mixed Arabic/Latin",
  sampleMixedValue: "A3LAM — موسوعة معرفية",
  sampleNumbersLabel: "Numbers",
  sampleNumbersValue: "2026 · 01 · 22.13.0",
  tokensEyebrow: "Semantic tokens",
  tokensTitle: "لغة بصرية قابلة للتوسع",
  tokenInk: "Ink / النص الأساسي",
  tokenBrand: "Brand / اللون الأساسي",
  tokenAccent: "Accent / التمييز",
  footerRtl: "تجربة عربية من اليمين إلى اليسار",
  footerNote: "© أعلام · موسوعة الشخصيات العربية",
  navHome: "الرئيسية",
  navPeople: "الشخصيات",
  navCategories: "التصنيفات",
  navAbout: "عن أعلام",
  navSearch: "البحث",
  menuLabel: "فتح القائمة",
  searchLabel: "ابحث في أعلام",
  searchPlaceholder: "ابحث عن اسم، مهنة، أو مدينة...",
  searchAction: "بحث",
  searchHint: "جرّب اسمًا أو مجالًا لاكتشاف ملفات موثقة",
  searchResults: "نتائج البحث",
  searchEmpty: "لم نعثر على تطابق في السجلات المنشورة الحالية.",
  searchLoading: "جارٍ البحث في السجلات المنشورة...",
  searchError: "تعذر تنفيذ البحث الآن. حاول مرة أخرى.",
  searchFilterLabel: "التصنيف",
  searchAllCategories: "كل التصنيفات",
  searchPageTitle: "اكتشف في أعلام",
  searchPageDescription: "ابحث في السجلات المنشورة، ثم تابع إلى الملف المرتبط بمصادره.",
  searchPageBack: "العودة إلى الاستكشاف",
  clearSearch: "مسح البحث",
  closeSearch: "إغلاق البحث",
  heroCta: "اكتشف الشخصيات",
  heroSecondary: "كيف نتحقق؟",
  statsPeople: "السجلات المنشورة",
  statsPublishedPeople: "السجلات المنشورة",
  statsCategories: "مجالات منشورة",
  statsCountries: "توسع عربي لاحق",
  featuredEyebrow: "ملفات مختارة",
  featuredTitle: "وجوهٌ تستحق أن تُعرف",
  featuredDescription: "تظهر هنا الملفات المنشورة بعد اجتياز التحقق التحريري وربط المعلومات بمصادرها.",
  featuredEmpty: "لا توجد ملفات منشورة في الكتالوج الحالي بعد.",
  dataUnavailable: "تعذر الوصول إلى الكتالوج المنشور الآن.",
  viewAll: "عرض الدليل",
  profileStatus: "نموذج عرض",
  profileStatusNote: "بيانات تجريبية لتوضيح الواجهة — ليست ملفًا منشورًا.",
  publishedProfileStatus: "ملف منشور",
  samplePersonOneName: "نموذج شخصية أولى",
  samplePersonOneRole: "الإعلام والصحافة",
  samplePersonOneMeta: "اليمن · ملف قيد المراجعة",
  samplePersonTwoName: "نموذج شخصية ثانية",
  samplePersonTwoRole: "الأكاديميا والبحث",
  samplePersonTwoMeta: "اليمن · ملف قيد المراجعة",
  samplePersonThreeName: "نموذج شخصية ثالثة",
  samplePersonThreeRole: "الثقافة والفنون",
  samplePersonThreeMeta: "اليمن · ملف قيد المراجعة",
  categoriesEyebrow: "اكتشف حسب المجال",
  categoriesTitle: "كل أثرٍ له سياقه",
  categoriesDescription: "تنقل بين المجالات لاكتشاف الأشخاص والأفكار والإنجازات ضمن سياقها المهني والثقافي.",
  categoriesPageTitle: "التصنيفات والمجالات",
  categoriesPageDescription: "مدخل منظم إلى مجالات المعرفة التي تنتمي إليها الملفات المنشورة في أعلام.",
  categoryResults: "ملفات منشورة",
  categoryNoPeople: "لا توجد ملفات منشورة في هذا المجال بعد.",
  categoryMedia: "الإعلام والصحافة",
  categoryAcademia: "الأكاديميا والبحث",
  categoryCulture: "الثقافة والفنون",
  categoryBusiness: "الأعمال والاقتصاد",
  categorySociety: "المجتمع والتأثير",
  categorySports: "الرياضة",
  categoryScience: "العلوم والتقنية",
  categoryCountSuffix: "مسارًا معرفيًا",
  ctaEyebrow: "ساهم في بناء المعرفة",
  ctaTitle: "لديك معلومة موثوقة؟ اجعلها تصل.",
  ctaDescription: "أعلام ينمو بالمصادر الدقيقة والتصحيحات المسؤولة. ستصبح أدوات المساهمة متاحة ضمن المراجعة التحريرية.",
  ctaAction: "اعرف المزيد",
  footerTagline: "منصة عربية لفهم أثر الأشخاص وصناعة المعرفة.",
  footerExplore: "استكشف",
  footerContribute: "ساهم",
  footerAbout: "المشروع",
  footerContact: "تواصل",
  footerPrivacy: "الخصوصية",
  footerRights: "جميع الحقوق محفوظة",
  demoLabel: "عرض تجريبي",
  demoDataNote: "لا تمثل هذه النماذج ملفات أشخاص منشورة.",
  publishedDataNote: "تُعرض هنا السجلات المنشورة فقط بعد التحقق وربط المصادر.",
  profileView: "عرض الملف",
  profileOverview: "نبذة عامة",
  profileFacts: "حقائق الملف",
  profileOccupation: "المهنة والمجال",
  profileCategories: "التصنيفات",
  profileRecordId: "معرّف داخلي",
  profileLastUpdated: "آخر تحديث",
  profileNoBiography: "لا تتوفر نبذة موسعة لهذا الملف بعد.",
  profileNoTimeline: "لا توجد أحداث زمنية منشورة لهذا الملف بعد.",
  profileNoEducation: "لا توجد بيانات تعليمية منشورة لهذا الملف بعد.",
  profileNoSources: "لا توجد مصادر منشورة لهذا الملف بعد.",
  profileRelatedCategories: "مجالات مرتبطة",
  profileRelatedPeople: "ملفات ذات صلة",
  profileSourceAccess: "فتح المصدر",
  personPageTitle: "صفحة نموذجية لملف شخصية",
  personPageLede: "هذه صفحة عرض محايدة توضّح بنية الملف العام قبل ربطها ببيانات منشورة ومصادر معتمدة.",
  backToDirectory: "العودة إلى الدليل",
  timelineLabel: "المسار الزمني",
  educationLabel: "التعليم والخبرة",
  sourcesLabel: "المصادر والتحقق",
  notPublished: "غير منشور بعد",
  notFoundEyebrow: "404 / أعلام",
  notFoundTitle: "هذه الصفحة غير موجودة",
  notFoundDescription: "لم نتمكن من العثور على الملف أو المسار المطلوب.",
  notFoundAction: "العودة إلى الرئيسية",
  aboutTitle: "عن أعلام",
  aboutDescription: "أعلام موسوعة عربية تُبنى حول ملفات منظمة، مصادر واضحة، ومراجعة بشرية قبل النشر.",
  contactTitle: "تواصل مع أعلام",
  contactDescription: "للاستفسارات التحريرية أو اقتراح مصدر، استخدم قنوات التواصل التي ستُعلن عند إطلاقها. هذه الصفحة لا تستقبل بيانات حساسة حاليًا.",
  privacyTitle: "الخصوصية",
  privacyDescription: "نحافظ على مبدأ تقليل البيانات، ولا نعرض معلومات شخصية حساسة أو وسائل اتصال خاصة. ستُوثّق سياسة الخصوصية التفصيلية قبل الإطلاق العام.",
};

const en: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "System foundation",
  siteEyebrow: "Arabic biographical encyclopedia",
  siteName: "A3LAM",
  phaseStatus: "Trusted knowledge platform",
  heroEyebrow: "Discover Arab impact",
  heroTitle: "Every impact begins with a sourced story",
  heroLede:
    "A3LAM is an Arabic space for discovering people shaping media, science, culture, and society. We organize knowledge clearly and connect every claim to its source.",
  primaryAction: "Explore people",
  secondaryAction: "Browse categories",
  scopeKicker: "Editorial principle",
  scopeTitle: "Accuracy before volume",
  scopeDescription: "Structured profiles · clear sources · human review",
  samplesEyebrow: "Foundation samples",
  samplesTitle: "A visual language built to scale",
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
  footerRtl: "Arabic right-to-left experience",
  footerNote: "© A3LAM · Arabic biographical encyclopedia",
  navHome: "Home",
  navPeople: "People",
  navCategories: "Categories",
  navAbout: "About A3LAM",
  navSearch: "Search",
  menuLabel: "Open menu",
  searchLabel: "Search A3LAM",
  searchPlaceholder: "Search a name, profession, or city...",
  searchAction: "Search",
  searchHint: "Try a name or field to discover reviewed profiles",
  searchResults: "Search results",
  searchEmpty: "No match in the current published records.",
  searchLoading: "Searching published records...",
  searchError: "Search is unavailable right now. Try again.",
  searchFilterLabel: "Category",
  searchAllCategories: "All categories",
  searchPageTitle: "Explore A3LAM",
  searchPageDescription: "Search published records and continue to profiles with clear source attribution.",
  searchPageBack: "Back to discovery",
  clearSearch: "Clear search",
  closeSearch: "Close search",
  heroCta: "Explore people",
  heroSecondary: "How we verify",
  statsPeople: "published records",
  statsPublishedPeople: "published records",
  statsCategories: "published fields",
  statsCountries: "future Arab expansion",
  featuredEyebrow: "Selected profiles",
  featuredTitle: "People worth knowing",
  featuredDescription: "Published profiles appear here after editorial review and source attribution.",
  featuredEmpty: "No published profiles are available in the current catalog yet.",
  dataUnavailable: "The published catalog is unavailable right now.",
  viewAll: "View directory",
  profileStatus: "Display sample",
  profileStatusNote: "Demo data to explain the interface — not a published profile.",
  publishedProfileStatus: "Published profile",
  samplePersonOneName: "Sample profile one",
  samplePersonOneRole: "Media & Journalism",
  samplePersonOneMeta: "Yemen · under review",
  samplePersonTwoName: "Sample profile two",
  samplePersonTwoRole: "Academia & Research",
  samplePersonTwoMeta: "Yemen · under review",
  samplePersonThreeName: "Sample profile three",
  samplePersonThreeRole: "Culture & Arts",
  samplePersonThreeMeta: "Yemen · under review",
  categoriesEyebrow: "Explore by field",
  categoriesTitle: "Every impact has a context",
  categoriesDescription: "Move through fields to discover people, ideas, and achievements in their professional and cultural context.",
  categoriesPageTitle: "Categories and fields",
  categoriesPageDescription: "A structured entry point to the knowledge fields represented by published A3LAM profiles.",
  categoryResults: "published profiles",
  categoryNoPeople: "No published profiles are available in this field yet.",
  categoryMedia: "Media & Journalism",
  categoryAcademia: "Academia & Research",
  categoryCulture: "Culture & Arts",
  categoryBusiness: "Business & Economy",
  categorySociety: "Society & Impact",
  categorySports: "Sports",
  categoryScience: "Science & Technology",
  categoryCountSuffix: "knowledge paths",
  ctaEyebrow: "Help build the record",
  ctaTitle: "Have a sourced fact? Help it travel.",
  ctaDescription: "A3LAM grows through careful sources and responsible corrections. Contribution tools will arrive within editorial review.",
  ctaAction: "Learn more",
  footerTagline: "An Arabic platform for understanding people and their impact.",
  footerExplore: "Explore",
  footerContribute: "Contribute",
  footerAbout: "The project",
  footerContact: "Contact",
  footerPrivacy: "Privacy",
  footerRights: "All rights reserved",
  demoLabel: "Display sample",
  demoDataNote: "These samples are not published person profiles.",
  publishedDataNote: "Only published records with verified source links appear here.",
  profileView: "View profile",
  profileOverview: "Overview",
  profileFacts: "Profile facts",
  profileOccupation: "Occupation and field",
  profileCategories: "Categories",
  profileRecordId: "Internal record ID",
  profileLastUpdated: "Last updated",
  profileNoBiography: "No extended overview is available for this profile yet.",
  profileNoTimeline: "No published timeline events are available yet.",
  profileNoEducation: "No published education records are available yet.",
  profileNoSources: "No published sources are available yet.",
  profileRelatedCategories: "Related fields",
  profileRelatedPeople: "Related profiles",
  profileSourceAccess: "Open source",
  personPageTitle: "Sample person profile page",
  personPageLede: "A neutral profile surface showing the public structure before it connects to published data and approved sources.",
  backToDirectory: "Back to directory",
  timelineLabel: "Timeline",
  educationLabel: "Education & experience",
  sourcesLabel: "Sources & verification",
  notPublished: "Not published yet",
  notFoundEyebrow: "404 / A3LAM",
  notFoundTitle: "This page does not exist",
  notFoundDescription: "We could not find the requested profile or route.",
  notFoundAction: "Return home",
  aboutTitle: "About A3LAM",
  aboutDescription: "A3LAM is an Arabic encyclopedia built around structured profiles, clear sources, and human review before publication.",
  contactTitle: "Contact A3LAM",
  contactDescription: "For editorial questions or source suggestions, use the channels announced at launch. This page does not currently collect sensitive information.",
  privacyTitle: "Privacy",
  privacyDescription: "We follow data minimization and do not expose sensitive personal information or private contact methods. A detailed privacy policy will be published before public launch.",
};

export const messages: Record<Locale, FoundationMessages> = { ar, en };

export function getMessages(locale: Locale): FoundationMessages {
  return messages[locale] ?? messages.ar;
}
