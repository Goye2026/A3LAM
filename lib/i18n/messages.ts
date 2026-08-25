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
  navCreateProfile: string;
  navMyProfile: string;
  navLogout: string;
  navLogin: string;
  navSigningOut: string;
  homeAudience: string;
  homeCreateProfile: string;
  homeExplore: string;
  editorUnsaved: string;
  editorSaved: string;
  editorSaving: string;
  editorSaveHint: string;
  moderationSearchPlaceholder: string;
  moderationAllCategories: string;
  moderationSortLabel: string;
  moderationSortUpdated: string;
  moderationSortCompletion: string;
  moderationSortName: string;
  moderationShowing: string;
  moderationNoMatch: string;
  profileShare: string;
  profileCopyLink: string;
  profilePrint: string;
  profileCopied: string;
  profileShareFailed: string;
  profileContact: string;
  profileContactHint: string;
  visibilityPublic: string;
  visibilityPublicHint: string;
  visibilityUnlisted: string;
  visibilityUnlistedHint: string;
  visibilityPrivate: string;
  visibilityPrivateHint: string;
  moderationAllVisibility: string;
  moderationAllCountries: string;
  moderationAllCities: string;
  moderationSortOldest: string;
  accountWelcomeTitle: string;
  accountWelcomeDescription: string;
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
  searchNoResultsHint: string;
  clearSearch: string;
  closeSearch: string;
  searchCity: string;
  searchCountry: string;
  searchProfessional: string;
  searchEditorial: string;
  searchLocationLabel: string;
  searchSkillsLabel: string;
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
  categoryPeopleTitle: string;
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
  profileBirth: string;
  profileDeath: string;
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
  sourceOfficial: string;
  sourceInstitution: string;
  sourceGovernment: string;
  sourceMedia: string;
  sourceProfessional: string;
  sourceAcademic: string;
  sourceSecondary: string;
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
  infoPageNextEyebrow: string;
  infoPageNextTitle: string;
  infoPageNextDescription: string;
  infoPageNextAction: string;
  adminTitle: string;
  adminSubtitle: string;
  adminLoginTitle: string;
  adminLoginDescription: string;
  adminAccessToken: string;
  adminLoginAction: string;
  adminLogout: string;
  adminAccessUnavailable: string;
  adminInvalidAccess: string;
  adminDashboard: string;
  adminPeople: string;
  adminAddPerson: string;
  adminReviewContent: string;
  adminPublished: string;
  adminDraft: string;
  adminReview: string;
  adminArchived: string;
  adminRecentUpdates: string;
  adminNoPeople: string;
  adminNoRecent: string;
  adminPeopleCount: string;
  adminSearch: string;
  adminFilterStatus: string;
  adminAllStatuses: string;
  adminAllCategories: string;
  adminSort: string;
  adminSortNewest: string;
  adminSortOldest: string;
  adminSortName: string;
  adminFilterAction: string;
  adminEdit: string;
  adminPreview: string;
  adminSaveDraft: string;
  adminSendReview: string;
  adminPublish: string;
  adminArchive: string;
  adminRestore: string;
  adminPersonNew: string;
  adminPersonEdit: string;
  adminBasicInformation: string;
  adminArabicName: string;
  adminEnglishName: string;
  adminSlug: string;
  adminShortBio: string;
  adminBiography: string;
  adminBirthDate: string;
  adminDeathDate: string;
  adminBirthPlace: string;
  adminDeathPlace: string;
  adminImageUrl: string;
  adminOccupations: string;
  adminOccupationsHint: string;
  adminCategories: string;
  adminCategoryCreateTitle: string;
  adminCategoryEditTitle: string;
  adminCategoryName: string;
  adminCategoryDescription: string;
  adminCategoryPublicNote: string;
  adminCreateCategory: string;
  adminUpdateCategory: string;
  adminCategorySaved: string;
  adminNoCategories: string;
  adminManageCategories: string;
  adminNotFound: string;
  adminSources: string;
  adminAddSource: string;
  adminSourceTitle: string;
  adminPublisher: string;
  adminSourceUrl: string;
  adminPublicationDate: string;
  adminAccessedAt: string;
  adminSourceType: string;
  adminReliability: string;
  adminReliabilityHigh: string;
  adminReliabilityMedium: string;
  adminReliabilityLow: string;
  adminTimeline: string;
  adminAddEvent: string;
  adminEventDate: string;
  adminEventTitle: string;
  adminEventDescription: string;
  adminEducation: string;
  adminAddEducation: string;
  adminInstitution: string;
  adminField: string;
  adminDateRange: string;
  adminDescription: string;
  adminRemove: string;
  adminSave: string;
  adminSaving: string;
  adminSaved: string;
  adminCancel: string;
  adminPreviewTitle: string;
  adminPreviewDescription: string;
  adminBackToEdit: string;
  adminDatabaseError: string;
  adminValidationError: string;
  adminUnauthorized: string;
  adminStatusLabel: string;
  adminStatusTransitionError: string;
  adminConflictError: string;
  adminSelectPlaceholder: string;
  adminNoSources: string;
  adminNoTimeline: string;
  adminNoEducation: string;
  adminPagePrevious: string;
  adminPageNext: string;
  adminUpdated: string;
  adminControlCenter: string;
  adminControlCenterDescription: string;
  adminPeopleGroup: string;
  adminOperationsGroup: string;
  adminProductGroup: string;
  adminSystemGroup: string;
  adminUsers: string;
  adminProfiles: string;
  adminAdministrators: string;
  adminEditors: string;
  adminContent: string;
  adminHomepage: string;
  adminAppearance: string;
  adminMedia: string;
  adminSeo: string;
  adminAudit: string;
  adminSystem: string;
  adminSettings: string;
  adminUnavailableTitle: string;
  adminUnavailableDescription: string;
  adminRequiresSchema: string;
  adminReadOnly: string;
  adminDatabaseStatus: string;
  adminAvailable: string;
  adminUnavailable: string;
  adminNoUsers: string;
  adminPeopleRelated: string;
  adminProfilesRelated: string;
};

const ar: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "أساس النظام",
  siteEyebrow: "موسوعة عربية · ملفات مهنية",
  siteName: "أعلام",
  phaseStatus: "منصة معرفية موثوقة",
  heroEyebrow: "اكتشف أثر الشخصيات العربية",
  heroTitle: "أعلام — موسوعة الشخصيات العربية والسير المهنية",
  heroLede:
    "اكتشف الشخصيات العربية، وابحث عن المهنيين، وأنشئ سيرتك الذاتية في مساحة واحدة. تُنشر الملفات المهنية بعد المراجعة وربط المعلومات بمصادر واضحة.",
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
  navPeople: "استكشف",
  navCategories: "التصنيفات",
  navAbout: "عن أعلام",
  navSearch: "البحث",
  navCreateProfile: "أنشئ سيرتك الذاتية",
  navMyProfile: "سيرتي المهنية",
  navLogout: "تسجيل الخروج",
  navLogin: "تسجيل الدخول",
  navSigningOut: "جارٍ تسجيل الخروج…",
  homeAudience: "موسوعة عربية + منصة سير ذاتية مهنية",
  homeCreateProfile: "أنشئ سيرتك الذاتية",
  homeExplore: "استكشف الأعلام",
  editorUnsaved: "لديك تغييرات غير محفوظة",
  editorSaved: "تم حفظ المسودة",
  editorSaving: "جارٍ حفظ المسودة…",
  editorSaveHint: "احفظ المسودة قبل مغادرة الصفحة حتى لا تفقد عملك.",
  moderationSearchPlaceholder: "ابحث بالاسم أو المسمى أو المدينة…",
  moderationAllCategories: "كل التصنيفات",
  moderationSortLabel: "ترتيب النتائج",
  moderationSortUpdated: "الأحدث تعديلًا",
  moderationSortCompletion: "الأعلى اكتمالًا",
  moderationSortName: "الاسم أبجديًا",
  moderationShowing: "عرض",
  moderationNoMatch: "لا توجد ملفات تطابق أدوات التصفية الحالية.",
  profileShare: "مشاركة الملف",
  profileCopyLink: "نسخ الرابط",
  profilePrint: "طباعة الملف",
  profileCopied: "تم نسخ رابط الملف",
  profileShareFailed: "تعذرت المشاركة؛ يمكنك نسخ الرابط يدويًا.",
  profileContact: "تواصل مهنيًا",
  profileContactHint: "تُفتح وسيلة التواصل التي اختار صاحب الملف إتاحتها فقط.",
  visibilityPublic: "عام",
  visibilityPublicHint: "يمكن لأي شخص العثور على ملفك عبر البحث والتصنيفات.",
  visibilityUnlisted: "غير مدرج",
  visibilityUnlistedHint: "يمكن لمن يملك الرابط مشاهدة ملفك، لكنه لا يظهر في البحث.",
  visibilityPrivate: "خاص",
  visibilityPrivateHint: "ملفك غير متاح للعامة.",
  moderationAllVisibility: "كل أنماط الظهور",
  moderationAllCountries: "كل الدول",
  moderationAllCities: "كل المدن",
  moderationSortOldest: "الأقدم تعديلًا",
  accountWelcomeTitle: "مرحبًا بك في أعلام",
  accountWelcomeDescription: "الخطوة التالية واضحة: أنشئ ملفك المهني وشارك خبرتك مع الآخرين.",
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
  searchNoResultsHint: "جرّب اسمًا أقصر، أو اختر مجالًا مختلفًا من التصنيفات.",
  clearSearch: "مسح البحث",
  closeSearch: "إغلاق البحث",
  searchCity: "المدينة",
  searchCountry: "الدولة",
  searchProfessional: "ملف مهني",
  searchEditorial: "سجل تحريري",
  searchLocationLabel: "الموقع",
  searchSkillsLabel: "المهارات",
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
  categoryPeopleTitle: "أشخاص هذا المجال",
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
  profileBirth: "الميلاد",
  profileDeath: "الوفاة",
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
  sourceOfficial: "رسمي",
  sourceInstitution: "مؤسسة",
  sourceGovernment: "حكومي",
  sourceMedia: "إعلامي",
  sourceProfessional: "مهني",
  sourceAcademic: "أكاديمي",
  sourceSecondary: "مصدر ثانوي",
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
  infoPageNextEyebrow: "الخطوة التالية",
  infoPageNextTitle: "ابدأ من الملفات المنشورة",
  infoPageNextDescription: "تصفح السجلات المتاحة أو انتقل بين المجالات لاكتشاف المعرفة المرتبطة بالمصادر.",
  infoPageNextAction: "استكشف الشخصيات",
  adminTitle: "التحرير الداخلي",
  adminSubtitle: "إدارة محتوى موسوعة أعلام",
  adminLoginTitle: "دخول مساحة التحرير",
  adminLoginDescription: "هذه المساحة مخصصة للمحررين المصرح لهم فقط.",
  adminAccessToken: "رمز الوصول التحريري",
  adminLoginAction: "دخول",
  adminLogout: "تسجيل الخروج",
  adminAccessUnavailable: "لم تُضبط حماية مساحة التحرير في هذه البيئة.",
  adminInvalidAccess: "رمز الوصول غير صحيح أو منتهي.",
  adminDashboard: "لوحة التحرير",
  adminPeople: "الشخصيات",
  adminAddPerson: "إضافة شخصية",
  adminReviewContent: "مراجعة المحتوى",
  adminPublished: "منشور",
  adminDraft: "مسودة",
  adminReview: "قيد المراجعة",
  adminArchived: "مؤرشف",
  adminRecentUpdates: "آخر التعديلات",
  adminNoPeople: "لا توجد شخصيات في السجل الحالي.",
  adminNoRecent: "لا توجد تعديلات حديثة.",
  adminPeopleCount: "إجمالي الشخصيات",
  adminSearch: "بحث داخلي",
  adminFilterStatus: "تصفية حسب الحالة",
  adminAllStatuses: "كل الحالات",
  adminAllCategories: "كل التصنيفات",
  adminSort: "الفرز",
  adminSortNewest: "الأحدث تحديثًا",
  adminSortOldest: "الأقدم تحديثًا",
  adminSortName: "الاسم الأبجدي",
  adminFilterAction: "تطبيق التصفية",
  adminEdit: "تحرير",
  adminPreview: "معاينة",
  adminSaveDraft: "حفظ كمسودة",
  adminSendReview: "إرسال للمراجعة",
  adminPublish: "نشر",
  adminArchive: "أرشفة",
  adminRestore: "إعادة إلى المراجعة",
  adminPersonNew: "إضافة شخصية جديدة",
  adminPersonEdit: "تحرير الشخصية",
  adminBasicInformation: "المعلومات الأساسية",
  adminArabicName: "الاسم بالعربية",
  adminEnglishName: "الاسم بالإنجليزية",
  adminSlug: "الرابط المختصر",
  adminShortBio: "النبذة المختصرة",
  adminBiography: "السيرة المنظمة",
  adminBirthDate: "تاريخ الميلاد",
  adminDeathDate: "تاريخ الوفاة",
  adminBirthPlace: "مكان الميلاد",
  adminDeathPlace: "مكان الوفاة",
  adminImageUrl: "رابط الصورة",
  adminOccupations: "المهن، مفصولة بفواصل",
  adminOccupationsHint: "اكتب كل مهنة في سطر أو افصل بينها بفواصل.",
  adminCategories: "التصنيفات",
  adminCategoryCreateTitle: "إضافة تصنيف",
  adminCategoryEditTitle: "تعديل التصنيف",
  adminCategoryName: "اسم التصنيف",
  adminCategoryDescription: "وصف التصنيف",
  adminCategoryPublicNote: "يُحفظ التصنيف الجديد كمنشور ليظهر في الموقع العام ونماذج الشخصيات.",
  adminCreateCategory: "إنشاء التصنيف",
  adminUpdateCategory: "حفظ التعديل",
  adminCategorySaved: "تم حفظ التصنيف.",
  adminNoCategories: "لا توجد تصنيفات بعد.",
  adminManageCategories: "إدارة التصنيفات",
  adminNotFound: "السجل المطلوب غير موجود.",
  adminSources: "المصادر",
  adminAddSource: "إضافة مصدر",
  adminSourceTitle: "عنوان المصدر",
  adminPublisher: "الناشر",
  adminSourceUrl: "رابط المصدر",
  adminPublicationDate: "تاريخ النشر",
  adminAccessedAt: "تاريخ الوصول",
  adminSourceType: "نوع المصدر",
  adminReliability: "تصنيف الموثوقية",
  adminReliabilityHigh: "مرتفع",
  adminReliabilityMedium: "متوسط",
  adminReliabilityLow: "منخفض",
  adminTimeline: "المسار الزمني",
  adminAddEvent: "إضافة حدث",
  adminEventDate: "تاريخ الحدث",
  adminEventTitle: "عنوان الحدث",
  adminEventDescription: "وصف الحدث",
  adminEducation: "التعليم",
  adminAddEducation: "إضافة تعليم",
  adminInstitution: "المؤسسة",
  adminField: "المجال أو البرنامج",
  adminDateRange: "الفترة",
  adminDescription: "الوصف",
  adminRemove: "حذف العنصر",
  adminSave: "حفظ التغييرات",
  adminSaving: "جارٍ الحفظ…",
  adminSaved: "تم الحفظ",
  adminCancel: "إلغاء",
  adminPreviewTitle: "معاينة تحريرية",
  adminPreviewDescription: "هذه المعاينة محمية ولا تظهر للعامة قبل النشر.",
  adminBackToEdit: "العودة إلى التحرير",
  adminDatabaseError: "تعذر الوصول إلى قاعدة البيانات الآن.",
  adminValidationError: "راجع الحقول المطلوبة والقيم غير الصالحة.",
  adminUnauthorized: "ليست لديك صلاحية الوصول إلى هذه المساحة.",
  adminStatusLabel: "حالة النشر",
  adminStatusTransitionError: "لا يسمح مسار التحرير بهذا الانتقال.",
  adminConflictError: "يوجد تعارض في السجل؛ راجع الرابط أو العملية الحالية.",
  adminSelectPlaceholder: "اختر…",
  adminNoSources: "أضف مصدرًا واحدًا على الأقل عند النشر.",
  adminNoTimeline: "لا توجد أحداث مضافة.",
  adminNoEducation: "لا توجد بيانات تعليمية مضافة.",
  adminPagePrevious: "السابق",
  adminPageNext: "التالي",
  adminUpdated: "آخر تحديث",
  adminControlCenter: "مركز التحكم",
  adminControlCenterDescription: "مساحة تشغيل موحدة لإدارة المحتوى والملفات المهنية وإعدادات المنتج بأمان.",
  adminPeopleGroup: "المحتوى التحريري",
  adminOperationsGroup: "التشغيل والمراجعة",
  adminProductGroup: "التحكم بالمنتج",
  adminSystemGroup: "النظام",
  adminUsers: "المستخدمون",
  adminProfiles: "الملفات المهنية",
  adminAdministrators: "المديرون",
  adminEditors: "المحررون",
  adminContent: "كل المحتوى",
  adminHomepage: "الصفحة الرئيسية",
  adminAppearance: "المظهر",
  adminMedia: "الوسائط والملفات",
  adminSeo: "تحسين الظهور",
  adminAudit: "سجل التدقيق",
  adminSystem: "حالة النظام",
  adminSettings: "الإعدادات",
  adminUnavailableTitle: "هذه الوظيفة غير مفعلة بعد",
  adminUnavailableDescription: "تحتاج هذه المساحة إلى بنية بيانات أو إعداد خارجي غير متاح في الإصدار الحالي.",
  adminRequiresSchema: "تحتاج تهيئة بنية البيانات",
  adminReadOnly: "للقراءة فقط",
  adminDatabaseStatus: "حالة قاعدة البيانات",
  adminAvailable: "متاحة",
  adminUnavailable: "غير متاحة",
  adminNoUsers: "لا توجد حسابات مستخدمين في النطاق الحالي.",
  adminPeopleRelated: "شخصيات مرتبطة",
  adminProfilesRelated: "ملفات مرتبطة",
};

const en: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "System foundation",
  siteEyebrow: "Arabic encyclopedia · professional profiles",
  siteName: "A3LAM",
  phaseStatus: "Trusted knowledge platform",
  heroEyebrow: "Discover Arab impact",
  heroTitle: "A3LAM — Arab people and professional profiles",
  heroLede:
    "Discover Arab people, search for professionals, and create your CV in one trusted space. Professional profiles are published after review and clear source attribution.",
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
  navPeople: "Explore",
  navCategories: "Categories",
  navAbout: "About A3LAM",
  navSearch: "Search",
  navCreateProfile: "Create your CV",
  navMyProfile: "My profile",
  navLogout: "Sign out",
  navLogin: "Sign in",
  navSigningOut: "Signing out…",
  homeAudience: "Arabic encyclopedia + professional CV platform",
  homeCreateProfile: "Create your CV",
  homeExplore: "Explore A3LAM",
  editorUnsaved: "You have unsaved changes",
  editorSaved: "Draft saved",
  editorSaving: "Saving draft…",
  editorSaveHint: "Save your draft before leaving so you do not lose your work.",
  moderationSearchPlaceholder: "Search by name, title, or city…",
  moderationAllCategories: "All categories",
  moderationSortLabel: "Sort results",
  moderationSortUpdated: "Recently updated",
  moderationSortCompletion: "Most complete",
  moderationSortName: "Name A–Z",
  moderationShowing: "Showing",
  moderationNoMatch: "No profiles match the current filters.",
  profileShare: "Share profile",
  profileCopyLink: "Copy link",
  profilePrint: "Print profile",
  profileCopied: "Profile link copied",
  profileShareFailed: "Sharing failed; you can copy the link manually.",
  profileContact: "Contact professionally",
  profileContactHint: "Only a contact method explicitly enabled by the profile owner is opened.",
  visibilityPublic: "Public",
  visibilityPublicHint: "Anyone can find your profile through search and categories.",
  visibilityUnlisted: "Unlisted",
  visibilityUnlistedHint: "Anyone with the link can view your profile, but it will not appear in search.",
  visibilityPrivate: "Private",
  visibilityPrivateHint: "Your profile is not available publicly.",
  moderationAllVisibility: "All visibility modes",
  moderationAllCountries: "All countries",
  moderationAllCities: "All cities",
  moderationSortOldest: "Oldest update",
  accountWelcomeTitle: "Welcome to A3LAM",
  accountWelcomeDescription: "Your next step is clear: create your professional profile and share your experience.",
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
  searchNoResultsHint: "Try a shorter name or choose a different field from the categories.",
  clearSearch: "Clear search",
  closeSearch: "Close search",
  searchCity: "City",
  searchCountry: "Country",
  searchProfessional: "Professional profile",
  searchEditorial: "Editorial record",
  searchLocationLabel: "Location",
  searchSkillsLabel: "Skills",
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
  categoryPeopleTitle: "People in this field",
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
  profileBirth: "Born",
  profileDeath: "Died",
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
  sourceOfficial: "Official",
  sourceInstitution: "Institution",
  sourceGovernment: "Government",
  sourceMedia: "Media",
  sourceProfessional: "Professional",
  sourceAcademic: "Academic",
  sourceSecondary: "Secondary",
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
  infoPageNextEyebrow: "Next step",
  infoPageNextTitle: "Start with published profiles",
  infoPageNextDescription: "Browse available records or move through the fields to discover source-linked knowledge.",
  infoPageNextAction: "Explore people",
  adminTitle: "Editorial workspace",
  adminSubtitle: "Manage A3LAM encyclopedia content",
  adminLoginTitle: "Editorial workspace sign-in",
  adminLoginDescription: "This space is limited to authorized editors.",
  adminAccessToken: "Editorial access token",
  adminLoginAction: "Sign in",
  adminLogout: "Sign out",
  adminAccessUnavailable: "Editorial access is not configured in this environment.",
  adminInvalidAccess: "The access token is invalid or expired.",
  adminDashboard: "Editorial dashboard",
  adminPeople: "People",
  adminAddPerson: "Add person",
  adminReviewContent: "Review content",
  adminPublished: "Published",
  adminDraft: "Draft",
  adminReview: "In review",
  adminArchived: "Archived",
  adminRecentUpdates: "Recent updates",
  adminNoPeople: "There are no people in the current records.",
  adminNoRecent: "There are no recent updates.",
  adminPeopleCount: "Total people",
  adminSearch: "Internal search",
  adminFilterStatus: "Filter by status",
  adminAllStatuses: "All statuses",
  adminAllCategories: "All categories",
  adminSort: "Sort",
  adminSortNewest: "Newest update",
  adminSortOldest: "Oldest update",
  adminSortName: "Alphabetical name",
  adminFilterAction: "Apply filters",
  adminEdit: "Edit",
  adminPreview: "Preview",
  adminSaveDraft: "Save draft",
  adminSendReview: "Send to review",
  adminPublish: "Publish",
  adminArchive: "Archive",
  adminRestore: "Return to review",
  adminPersonNew: "Add new person",
  adminPersonEdit: "Edit person",
  adminBasicInformation: "Basic information",
  adminArabicName: "Arabic name",
  adminEnglishName: "English name",
  adminSlug: "Public slug",
  adminShortBio: "Short biography",
  adminBiography: "Structured biography",
  adminBirthDate: "Birth date",
  adminDeathDate: "Death date",
  adminBirthPlace: "Birth place",
  adminDeathPlace: "Death place",
  adminImageUrl: "Image URL",
  adminOccupations: "Occupations, comma-separated",
  adminOccupationsHint: "Enter one occupation per line or separate them with commas.",
  adminCategories: "Categories",
  adminCategoryCreateTitle: "Add category",
  adminCategoryEditTitle: "Edit category",
  adminCategoryName: "Category name",
  adminCategoryDescription: "Category description",
  adminCategoryPublicNote: "New categories are saved as published so they appear on the public site and person forms.",
  adminCreateCategory: "Create category",
  adminUpdateCategory: "Save changes",
  adminCategorySaved: "Category saved.",
  adminNoCategories: "No categories yet.",
  adminManageCategories: "Manage categories",
  adminNotFound: "The requested record was not found.",
  adminSources: "Sources",
  adminAddSource: "Add source",
  adminSourceTitle: "Source title",
  adminPublisher: "Publisher",
  adminSourceUrl: "Source URL",
  adminPublicationDate: "Publication date",
  adminAccessedAt: "Access date",
  adminSourceType: "Source type",
  adminReliability: "Reliability",
  adminReliabilityHigh: "High",
  adminReliabilityMedium: "Medium",
  adminReliabilityLow: "Low",
  adminTimeline: "Timeline",
  adminAddEvent: "Add event",
  adminEventDate: "Event date",
  adminEventTitle: "Event title",
  adminEventDescription: "Event description",
  adminEducation: "Education",
  adminAddEducation: "Add education",
  adminInstitution: "Institution",
  adminField: "Field or program",
  adminDateRange: "Date range",
  adminDescription: "Description",
  adminRemove: "Remove item",
  adminSave: "Save changes",
  adminSaving: "Saving…",
  adminSaved: "Saved",
  adminCancel: "Cancel",
  adminPreviewTitle: "Editorial preview",
  adminPreviewDescription: "This preview is protected and is not public before publication.",
  adminBackToEdit: "Back to editing",
  adminDatabaseError: "The database is unavailable right now.",
  adminValidationError: "Review required fields and invalid values.",
  adminUnauthorized: "You are not authorized to access this space.",
  adminStatusLabel: "Publication status",
  adminStatusTransitionError: "This editorial transition is not allowed.",
  adminConflictError: "The record conflicts with an existing record or current operation.",
  adminSelectPlaceholder: "Select…",
  adminNoSources: "Add at least one source before publishing.",
  adminNoTimeline: "No events added.",
  adminNoEducation: "No education records added.",
  adminPagePrevious: "Previous",
  adminPageNext: "Next",
  adminUpdated: "Updated",
  adminControlCenter: "Control center",
  adminControlCenterDescription: "A unified operational space for content, professional profiles, and safe product controls.",
  adminPeopleGroup: "Editorial content",
  adminOperationsGroup: "Operations and review",
  adminProductGroup: "Product controls",
  adminSystemGroup: "System",
  adminUsers: "Users",
  adminProfiles: "Professional profiles",
  adminAdministrators: "Administrators",
  adminEditors: "Editors",
  adminContent: "All content",
  adminHomepage: "Homepage",
  adminAppearance: "Appearance",
  adminMedia: "Media and files",
  adminSeo: "SEO",
  adminAudit: "Audit log",
  adminSystem: "System status",
  adminSettings: "Settings",
  adminUnavailableTitle: "This function is not enabled yet",
  adminUnavailableDescription: "This area requires a data structure or external configuration that is not available in the current release.",
  adminRequiresSchema: "Requires schema configuration",
  adminReadOnly: "Read-only",
  adminDatabaseStatus: "Database status",
  adminAvailable: "Available",
  adminUnavailable: "Unavailable",
  adminNoUsers: "There are no user accounts in the current scope.",
  adminPeopleRelated: "Related people",
  adminProfilesRelated: "Related profiles",
};

export const messages: Record<Locale, FoundationMessages> = { ar, en };

export function getMessages(locale: Locale): FoundationMessages {
  return messages[locale] ?? messages.ar;
}
