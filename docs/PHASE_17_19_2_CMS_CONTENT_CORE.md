# A3LAM — Phase 17.19.2
## CMS Content Management Core, WordPress-like Admin UX & Safe Content Model

**القرار:** **PASS WITH LIMITATIONS**

اكتملت هذه المرحلة فوق معمارية A3LAM القائمة دون استبدال framework أو إدخال PHP/WordPress runtime أو إنشاء generic content database لمجرد تقليد WordPress. التجربة أصبحت أقرب إلى CMS مألوف في IA وshell وlist/editor discovery، مع بقاء حدود domain وsecurity وAI صريحة وقابلة للتدقيق.

## 1. ما تم تنفيذه

تم توسيع Content Type Registry ليصف الكيانات الفعلية `Person` و`Profile` و`Category` مع `storageTable` و`readPermission` و`actions` وeditor domain-specific وlifecycle capabilities. أضيفت أنواع صريحة لـ`page` و`post` و`tag` لكنها تبقى `not_available` بلا route أو storage table أو mutation path. لا توجد persistence جديدة لهذه الأنواع.

تم تحديث Content Hub في `/admin/content` ليقرأ registry ويطبق `hasEffectiveAdminPermission` على الخادم، ويعرض فقط الأنواع المتاحة للمستخدم المصرح له. تعرض الأنواع غير المدعومة بصريًا كغير متاحة دون روابط وهمية أو أزرار لا تعمل.

تمت إعادة تركيب Admin Shell حول primitives قابلة لإعادة الاستخدام. أصبح shell يتضمن top bar يعرض admin principal الفعلي مع logout، وHeader موحدًا يعتمد على localization، وbreadcrumbs وnotifications وcontent/footer primitives. أضيف mobile drawer حقيقي مع `aria-expanded` و`aria-controls`، وactive route indication، وإمكانية طي مجموعات التنقل عبر `details/summary`. بقيت navigation قائمة declarative وRBAC-filtered على الخادم.

تم ضبط Admin IA النهائي ليكون: Dashboard، Content، Media، Appearance، Users، Settings، Tools، وAI. قسم AI ما زال مسارًا محميًا منفصلًا، ولا يندمج مع صلاحيات CMS العامة.

تم تحسين Media Library بإضافة تبديل deterministic بين grid وlist مع `aria-pressed` وحالة responsive. لم يتغير provider أو upload contract؛ upload يبقى مقيدًا بالتهيئة القائمة، وتظهر حالات schema/provider بصراحة، وتبقى archive/attachment/public-private boundaries كما هي.

تم الحفاظ على Person editor الحالي باعتباره Domain Editor مستقلًا. لم يتم تحويل Person إلى generic post أو تغيير حقوله أو lifecycle أو API. استمر استخدام structured biography وsources وtimeline وeducation وmedia وreadiness وsame-origin/RBAC mutation contracts القائمة.

تم تحديث localization العربية والإنجليزية لتسميات Tools وgrid/list، وإزالة النصوص الثابتة من Admin Header، وإضافة CSS صغير داخل tokens الحالية لدعم top bar وmobile drawer وmedia list view دون إنشاء design system منافس.

## 2. نموذج المحتوى الفعلي

| النوع | التخزين | الحالة | المحرر | النطاق |
| --- | --- | --- | --- | --- |
| Person | `people` وعلاقاتها | متاح؛ draft/review/published/archived حسب العقود القائمة | Person domain editor | تحرير ومراجعة ونشر عبر endpoints القائمة |
| Profile | `profiles` وعلاقاتها | متاح ضمن moderation domain | Profile domain | منفصل عن Person وعن User |
| Category | `categories` وعلاقاتها | متاح كtaxonomy قائمة | Category editor | قراءة/إنشاء/تعديل حسب RBAC القائمة |
| Page | لا يوجد | غير متاح | لا يوجد | لا persistence ولا route |
| Post/Article | لا يوجد | غير متاح | لا يوجد | لا persistence ولا route |
| Tag | لا يوجد | غير متاح | لا يوجد | لا persistence ولا route |

لم تُنشأ أو تُعدّل أي migration، ولم تُطبق أي migration. schema الحالي ظل مصدر الحقيقة.

## 3. Theme, templates, menus, widgets وAppearance

Theme Registry الحالي allowlisted ويحتوي على theme واحد A3LAM-native فعال هو `a3lam-editorial`. Template resolution حتمي، ويعيد fallback آمنًا إلى `not-found` عند طلب template غير مدعوم. لا توجد dynamic imports أو eval أو `new Function` أو مكونات قادمة من user/database configuration.

SiteFrame يعيد استخدام `SiteHeader` و`SiteFooter` الحاليين، ويحافظ على published site-experience config وRTL وmetadata وpublic URLs. Appearance editor يبقى مربوطًا بالـresources القائمة: settings وidentity وappearance وhomepage وnavigation وfooter وSEO وprofile presentation.

Menus مدعومة فعليًا كـflat navigation/footer configuration داخل `site_experience_configs` مع ordering وsafe URL validation. لا توجد nested menu persistence مستقلة. Widgets تستخدم registry ثابتًا فقط؛ widgets المتاحة deterministic، بينما posts/tags/custom executable widgets لا تُعرض كقدرات مفعلة.

## 4. RBAC وSecurity

لم يُنشأ نظام permissions موازٍ. استُخدمت `ADMIN_PERMISSION_CODES` و`effectivePermissionsForPrincipal` و`hasEffectiveAdminPermission` القائمة. الواجهة لا تعتبر إخفاء الرابط authorization؛ endpoints الحالية هي enforcement boundary.

استمر نمط mutation الموجود: server-side authentication، RBAC، same-origin/CSRF-style check، validation bounded payload، safe error mapping، audit logging، وعدم كشف secrets. biography renderer الحالي structured-only ولا يستخدم `dangerouslySetInnerHTML`. روابط الصور والـnavigation تمر عبر safe URL boundaries القائمة. لا توجد arbitrary code execution أو user-supplied components أو database-driven imports.

Person/Profile/User ظلوا كيانات منفصلة. لم تُضف أي آلية generic لإنشاء Person من AI أو من CMS، ولم يُمس AI activation/readiness أو DRAFT/human-review/publication firewall.

## 5. الاختبارات والتحقق المحلي

| التحقق | النتيجة الفعلية |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS؛ Already up to date باستخدام pnpm 11.21.0 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS بلا أخطاء؛ بقي تحذيران سابقان في `tests/phase17.18.15.test.ts` فقط |
| `pnpm test` | PASS؛ 33 ملف اختبار و266 اختبارًا ناجحًا |
| focused CMS tests | PASS؛ 9/9 في `tests/phase17.19.1.test.ts` |
| `pnpm build` | PASS؛ Next.js 16.3.1 production build و71 static pages generated |
| `git diff --check` | PASS |
| integration tests / migration runner / seed | NOT RUN وفق العقد |

تغطي الاختبارات المركزة uniqueness وactive theme وtemplate fallback وmenu URL/cycle/depth safety وwidget allowlist وcontent type availability/RBAC وsame-origin Person mutation contract وsafe biography rendering وpublic route preservation وMedia view contract وعدم bypass AI.

## 6. Production verification

تم دفع commit عبر Git إلى [Goye2026/A3LAM](https://github.com/Goye2026/A3LAM) على `main`. deployment Git-triggered النهائي هو [dpl_Em7w9kzMQYAmbUriZeyKcB4aJagH](https://vercel.com/goye2026s-projects/a3-lam/Em7w9kzMQYAmbUriZeyKcB4aJagH)، وأصبح `READY` على alias [https://a3-lam.vercel.app](https://a3-lam.vercel.app).

تم تنفيذ GET-only smoke بعد READY، دون login أو form submission أو upload أو mutation. النتائج:

| المسار/الفحص | النتيجة |
| --- | --- |
| `/` | 200 |
| `/api/health` | 200 |
| `/categories` | 200 |
| `/search` | 200 |
| `/robots.txt` | 200؛ يحتوي سياسة منع `/admin` |
| `/sitemap.xml` | 200 |
| `/admin` anonymous | 307 |
| `/admin/ai` anonymous | 307 |
| `/api/admin/ai/readiness` anonymous | 401 |
| `/api/admin/ai/documents` anonymous | 401 |
| `/person/` malformed route | 308 آمن إلى `/person` ثم 404 نهائي |
| public response privacy scan | PASS |

لم يُنفذ في Production أي POST أو PUT أو PATCH أو DELETE أو upload أو publication أو migration أو seed أو provider/OCR/queue call.

## 7. Counters وقيود الرصد

| العداد | حالة Phase 17.19.2 |
| --- | --- |
| Production mutations | Confirmed zero خلال هذه المرحلة؛ التاريخ السابق غير observable من هذا التدقيق |
| Production uploads | Confirmed zero |
| Production documents/jobs/inference/provider calls | Confirmed zero |
| People/Profiles created | Confirmed zero |
| migrations/DDL/DML/seeds | Confirmed zero |
| secrets/Vercel/DNS changes | Confirmed zero خلال هذه المرحلة |
| historical production totals | NOT OBSERVABLE |

لا يجب تفسير `confirmed zero during this phase` على أنه إحصاء تاريخي شامل للبيئة.

## 8. Git state

| الحقل | القيمة |
| --- | --- |
| Implementation commit | `2da0814fe9c310139ecb16da1d4f006b35db27c5` — `feat: advance A3LAM CMS content core` |
| Documentation commit | سيُثبت في commit التوثيق النهائي بعد تسجيل هذه الوثيقة |
| Final HEAD | سيُثبت بعد commit التوثيق النهائي |
| origin parity | سيُثبت بعد push التوثيق النهائي |
| Working tree | يجب أن يكون clean بعد commit/push التوثيق النهائي |

تم استخدام commits وpushes طبيعية فقط؛ لم يُستخدم reset أو rebase أو force-push.

## 9. Limitations

هذه المرحلة لم تنشئ Page/Post/Tag persistence أو CRUD لهذه الأنواع، لأن schema الحالي لا يدعمها ولا يبرر migration لمجرد محاكاة WordPress. كما لم تُنشأ Widgets persistence مستقلة أو nested menus مستقلة؛ المتاح هو registry/configuration القائم.

Media Library لا توفر upload عامًا جديدًا؛ upload لا يزال مقيدًا بمزود التخزين والـschema readiness، وهذا مقصود لأسباب السلامة. لم تُجرَ اختبارات Firefox/Safari/WebKit أو screen-reader أو قياسات WCAG 2.2 AA ضمن هذا التنفيذ؛ لا توجد claimات توافق خارج ما تم اختباره محليًا وضمن smoke المعلن.

لم تُشغّل integration tests لأنها قد تتطلب migration/seed واتصال قاعدة بيانات. لم تُستخدم `DATABASE_URL` ولم تُجرَ أي production data creation أو population.

## 10. المرحلة التالية

> **PHASE 17.19.3 — NOT STARTED**

كما أن Phase 17.20 وPhase 18 وPopulation وProduction AI activation غير مبدوءة. تتوقف المهمة هنا وفق عقد Phase 17.19.2.
