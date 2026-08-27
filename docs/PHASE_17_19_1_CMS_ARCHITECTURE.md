# A3LAM — Phase 17.19.1 CMS Architecture

**الحالة:** قيد الإغلاق بعد التحقق المحلي؛ لا تبدأ Phase 17.19.2 أو Phase 17.20 أو Phase 18.

**النطاق:** تأسيس معمارية CMS أصلية مستوحاة من وضوح IA وتجربة محررات المحتوى الحديثة، مع الحفاظ على Next.js/React/TypeScript/Drizzle الحالية، وفصل User عن Person عن Profile، وعدم استخدام PHP أو WordPress code/branding/assets/runtime.

## 1. نتيجة التدقيق

تم تدقيق المشروع الحالي قبل التنفيذ. المشروع يعمل على Next.js 16.3.1 App Router وReact 19.2.8 وTypeScript 6.0.2 وNode.js 22.13.0 وpnpm 11.21.0، ويستخدم Drizzle ORM مع PostgreSQL عبر postgres-js. لم تُجرَ إعادة تهيئة أو إعادة منصة المشروع.

المسارات العامة ومسارات الإدارة القائمة بقيت موجودة، بما في ذلك صفحات الأشخاص والتصنيفات والبحث والـsitemap والـrobots، إضافة إلى مسارات API الحالية. توجد حماية خادمية لمساحة الإدارة عبر `requireAdminPage()` في layout المحمي، ويستمر حساب الصلاحيات الفعلية عبر `effectivePermissionsForPrincipal()`.

## 2. قرار persistence

لا توجد في schema الحالية جداول مستقلة لـPages أوPosts أوTags أوMenus أوWidgets أوThemes أوSidebars. لذلك لم تتم إضافة migration أو جدول جديد لتقليد WordPress. تم اختيار طبقة static/config-driven typed abstraction، مع إظهار المفاهيم غير المدعومة بصفتها `not_available` أو `planned` وعدم إنشاء أزرار حفظ وهمية.

| المفهوم | الحالة الحالية | القرار |
| --- | --- | --- |
| Person | مدعوم ومخزن في `people` مع علاقاته الحالية | يبقى domain-specific ولا يتحول إلى Post |
| Profile | مدعوم ومفصول عن Person وفق العقود القائمة | لم يُدمج مع Person أو User |
| Page | غير متاح persistence | مسجل كـ`not_available` بدون رابط تنفيذي |
| Post | غير متاح persistence | مسجل كـ`not_available` بدون رابط تنفيذي |
| Tag | غير موجود في schema | لا واجهة fake ولا migration |
| Menu | إعدادات الموقع الحالية هي مصدر الحقيقة | أضيفت safe static registry كطبقة تحقق وترتيب فقط |
| Widget | لا توجد persistence لمكونات user-supplied | allowlist ثابت؛ unknown IDs مرفوضة |
| Theme | Appearance/config الحالية هي seam المدعوم | registry ثابت بثيم A3LAM واحد فقط |

## 3. Admin Information Architecture

أصبح Admin Shell مبنيًا على سجل declarative في `lib/cms/adminNavigation.ts`. المجموعات الحالية هي: Dashboard، Content، Media، Appearance، Users، Settings، Tools، وAI. كل عنصر يحدد المسار والصلاحية والحالة، وتتم الفلترة في الخادم قبل تمرير القائمة إلى الواجهة. العناصر غير المدعومة تظهر disabled مع عبارة localized بدل إنشاء روابط إلى صفحات غير موجودة.

المكونات المشتركة في `components/a3lam/AdminDesignSystem.tsx` تشمل AdminHeader وAdminBreadcrumbs وAdminPageHeader وAdminContent وAdminFooter وAdminNotifications وAdminStatusBadge وAdminEmptyState. أما Sidebar التفاعلي المنفصل في `components/a3lam/AdminSidebar.tsx` فيستخدم `usePathname()` فقط لإظهار active state، مع `<details>/<summary>` للإغلاق والفتح، ولا يُستخدم لإثبات الصلاحيات أو فرضها.

تمت المحافظة على CSS الحالي في `app/globals.css`، وإضافة امتداد صغير فقط لنفس tokens والـRTL/focus/responsive/reduced-motion conventions. لا يوجد design system CSS منافس.

## 4. Content Type Registry

الملف `lib/cms/contentRegistry.ts` يعرّف Person كسجل متاح مع `storageTable: "people"` وworkflow draft/review/publication الحالي. Page وPost معرفان لأغراض IA فقط، مع `storageTable: null` و`supportsPublication: false` و`availability: "not_available"`. هذا يمنع الخلط بين نموذج السيرة المنظمة ونموذج المقال العام.

## 5. Theme وTemplate architecture

الملف `lib/cms/themeRegistry.ts` يحتوي allowlist ثابتًا بثيم واحد:

- `a3lam-editorial`
- الإصدار `1.0.0`
- الحالة `active`
- templates المدعومة: `index`, `single-person`, `archive`, `search`, `not-found`
- layout parts: `header`, `footer`, `sidebar`, `content`

الدالة `resolveTemplate()` تعيد fallback حتميًا إلى `not-found` للمسارات الخاصة بـPage/Post غير المدعومة. لا توجد dynamic imports أو `eval` أو `new Function` أو مكونات يحددها المستخدم أو قاعدة البيانات.

تمت إضافة `components/a3lam/SiteFrame.tsx` كـServer Component يعيد استخدام `SiteHeader` و`SiteFooter` الحاليين، ويضيف metadata attributes للثيم والقالب، مع الإبقاء على published site-experience config والـRTL. تمت إعادة تركيب الصفحة الرئيسية فقط عبر SiteFrame دون تغيير الـURL أو public projection أو metadata behavior.

صفحة Appearance تعرض الآن اسم الثيم النشط وإصداره وقدراته من registry الثابت، ثم تعيد استخدام `AdminSiteExperiencePage` وbackend contracts الحالية. لا توجد controls لتغيير كود أو تحميل ثيمات.

## 6. Menus وWidgets

`lib/cms/menuRegistry.ts` يوفر:

- التحقق من internal paths أو HTTPS فقط.
- رفض `javascript:`, `data:`, `vbscript:` وprotocol-relative URLs.
- كشف duplicate IDs والـmissing parents والـcycles.
- حدًا أقصى ثابتًا للـnesting (`MAX_MENU_DEPTH = 2`).
- ترتيبًا حتميًا حسب `order` ثم `id`.

`widgetRegistry` لا يقبل إلا IDs مسبقة التعريف. Widgets التي تعتمد على Posts أوTags معلّمة `not_available`، وcustom text معلّم `planned` ولا يسمح بأي HTML أو component code.

## 7. حدود AI والأمن

لم تتغير ملفات AI أو readiness أو activation. Production AI/upload/generation/OCR/publication ما زالت disabled وfail-closed. اختبارات المرحلة تتحقق من بقاء `AI_PRODUCTION_ENABLED = false` و`AI_PUBLICATION_ENABLED = false` ومن عدم استيراد test-only adapters في runtime.

لم تُنفذ أي POST/PUT/PATCH/DELETE أو upload إلى Production، ولم تُستخدم DATABASE_URL، ولم تُشغّل migrations أو seed أو provider/OCR/external API calls، ولم تُغير secrets أو Vercel/DNS. طبقة CMS الجديدة لا تمنح صلاحيات ولا تتجاوز RBAC؛ security enforcement يبقى server-side في العقود القائمة.

## 8. التحقق المحلي

| الفحص | النتيجة الفعلية |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm vitest run tests/phase17.19.1.test.ts --config vitest.config.ts` | PASS — 8 اختبارات |
| `pnpm test` | PASS — 33 ملفات، 265 اختبارًا |
| `pnpm lint` | PASS — لا أخطاء؛ تحذيران سابقان غير متعلقين بهذه المرحلة في `tests/phase17.18.15.test.ts` |
| `git diff --check` | PASS |
| `pnpm build` | PASS — Next.js 16.3.1، compile وTypeScript وpage generation مكتملة |

اختبارات المرحلة الجديدة تغطي uniqueness للـtheme، active theme exact-one، template fallback، content availability، URL safety، menu cycles/depth/order، widget allowlist، Admin navigation RBAC/support state، منع dynamic execution، AI regression، biography editor contract، ووجود public route files.

## 9. الملفات الرئيسية

| الملف | الغرض |
| --- | --- |
| `lib/cms/types.ts` | الأنواع المركزية لمعمارية CMS |
| `lib/cms/themeRegistry.ts` | الثيم allowlist والقوالب والـfallback |
| `lib/cms/themeRenderer.ts` | بناء render context آمن وحتمي |
| `lib/cms/menuRegistry.ts` | safe menu validation/order/nesting |
| `lib/cms/contentRegistry.ts` | content types وwidgets availability |
| `lib/cms/adminNavigation.ts` | Admin IA declarative مع permission metadata |
| `components/a3lam/AdminDesignSystem.tsx` | primitives المشتركة للـAdmin |
| `components/a3lam/AdminSidebar.tsx` | Sidebar client-safe active/collapsible |
| `components/a3lam/SiteFrame.tsx` | public header/content/footer frame |
| `tests/phase17.19.1.test.ts` | deterministic architecture/security regression tests |

## 10. القيود المتبقية

هذه المرحلة لا تنشئ persistence لـPages/Posts/Tags/Menus/Widgets/Themes/Sidebars، ولا تدّعي وجودها. لا توجد واجهة CRUD لهذه المفاهيم، ولا semantic search، ولا AI research assistant، ولا public API جديدة. إدارة Person تبقى عبر `AdminPersonForm` الحالية schema-backed، ولم يُعاد بناؤها أو تحويلها إلى generic post editor.

التحقق الخارجي من Production لم يُنفذ في هذه المرحلة، ولا توجد مصادقة أو mutation في smoke checks. يلزم التحقق المستقل لاحقًا وفق قيود التشغيل، وليس جزءًا من هذه المرحلة.

## 11. حدود المرحلة

**Phase 17.19.1 فقط** تم تنفيذها. Phase 17.19.2 وPhase 17.20 وPhase 18 غير مُبدأة. كما أن Population وProduction AI activation وmigration application غير مُبدأة وغير منفذة.
