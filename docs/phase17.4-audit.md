# A3LAM — Phase 17.4 Architecture Audit

## Scope and baseline

تستهدف هذه المرحلة تشغيل أساس Admin Control Center وRBAC وSite Experience الموجود في Phase 17.1–17.3. الحالة قبل التنفيذ: الفرع `main` نظيف، و`HEAD == origin/main` عند `d82a026d92fea5dfcd1f85154e0e910b6deb4f79`، وProduction code deployment سابق بحالة READY. لا تبدأ Population أو Phase 18، ولا يُسمح بأي Production migration أو DML أو إنشاء حسابات/بيانات.

## Existing reusable foundations

المصادقة الإدارية منفصلة عن public-user auth، ومسارات Admin تستخدم `requirePermission` أو `requirePermissionPrincipal` في معظم APIs. `isSameOriginMutation` موجود ويُستخدم في mutations. RBAC مركزي في `lib/admin/rbac.ts` مع role defaults وeffective permission overrides. Site Experience في `lib/site-experience/` يملك typed parsers، resource access map، repository، وDraft/Published persistence planned by migration `0006_phase17_3_site_experience.sql`.

الواجهة العامة تقرأ published configuration فقط مع fallback آمن عند غياب schema أو dependency. Admin protected layout يفرض authentication فقط؛ لذلك يجب أن تبقى permission gates في كل page/API boundary ولا يجوز اعتبار إخفاء navigation حماية.

## Gaps identified for Phase 17.4

| Area | Current finding | Phase 17.4 treatment |
|---|---|---|
| Admin IA | معظم المسارات موجودة، لكن `/admin/system` و`/admin/settings` و`/admin/media` تحتاج status/availability copy أوضح، وبعض routes العامة للمحتوى مجرد shortcuts | توحيد group labels وtruthful states، دون صفحات شكلية جديدة |
| Permission contracts | vocabulary مركزي لكنه لا يتضمن dashboard-specific permission ولا read-only configuration/security permissions منفصلة | عدم اختراع صلاحيات غير لازمة؛ توحيد gates الحالية وتوثيق shared dashboard policy |
| Lifecycle | admin statuses هي `invited`, `active`, `disabled`؛ activation يتطلب passwordHash؛ لا يوجد invitation provider | الإبقاء على schema والـRequires Configuration، منع final Super Admin downgrade/disable/permission loss |
| Sessions | Admin session revocation موجود، وpublic user sessions منفصلة؛ summary لا يعرض raw tokens | regression tests للـrevocation والـseparation، دون توسعة سرية |
| Audit | audit يملك actor/action/entity/field/timestamps لكنه لا يملك outcome أو safe metadata مستقلة | عدم إضافة schema بلا ضرورة؛ توثيق أن success mutations تُسجل، وأن failure/denial لا تُخزّن كـoutcome في العقد الحالي |
| Site Experience | typed draft/published repository وpublish transaction موجودان؛ بعض resource publish permissions تشارك update permission | مراجعة isolation وpreview/public routes، مع إبقاء publish permission map الحالي إذا كان متوافقًا |
| System health | snapshot يعرض database/storage/email/configuration/media count فقط، ولا يعرض migration status أو auth/deployment/config readiness | توسيع read-only snapshot بمعلومات غير سرية، مع graceful degradation |
| Users/Admins | user projection آمن، وadmin lifecycle يمنع تفعيل بلا credential؛ UI server authority موجود | مراجعة visibility of actions، status semantics، last activity، وfinal Super Admin invariants |
| Security | APIs الجديدة تحافظ على auth/permission/validation/same-origin، لكن يجب إجراء route sweep وIDOR/privilege audit | إضافة tests أو helpers فقط حيث تضيف قيمة، دون تغيير auth architecture |
| External providers | email غير مهيأ وmedia upload غير موصول | تبقى `REQUIRES CONFIGURATION`؛ لا provider أو credentials جديدة |

## Migration review boundary

المigrations `0004`, `0005`, و`0006` موجودة في Git لكنها غير مطبقة بحسب السجل السابق. يجب فحصها وrunner فقط للتحقق من الترتيب/idempotence، ثم إيقاف أي خطوة تحتاج Production authorization. لا تُنشأ بيانات seed ولا local DB rows.

## Initial decision

الأولوية في Phase 17.4 هي تقوية التشغيل والحوكمة والاختبارات، لا إضافة domain features جديدة. أي نقص يتطلب schema جديدًا يجب أن يُوثق كـ`CREATED / NOT APPLIED`، وأي نقص يتطلب provider أو secret يبقى `REQUIRES CONFIGURATION`.

## Phase 17.4 implementation decisions (current)

أضيفت page-level permission gates server-side لصفحات People وCategories وProfiles، مع إبقاء API gates هي boundary الأمنية النهائية. صفحة `/admin/content` أصبحت permission-aware؛ لا تعرض إلا روابط المجالات التي يملك Admin صلاحية قراءتها، وترفض الوصول عند غياب أي صلاحية محتوى. أغلفة Site Experience تبقى آمنة لأن `AdminSiteExperiencePage` يطبق resource-specific read/update/publish gates مركزيًا.

صفحة `/admin/profiles/[id]` أصبحت تتطلب `profiles.read` قبل تحميل projection المراجعة أو بيانات الاتصال والملفات. أزرار الانتقال لا تظهر إلا وفق الصلاحية الفعلية: `profiles.publish` للنشر، و`profiles.moderate` للإرجاع/الأرشفة/الاستعادة. تبقى حماية API مستقلة ولا تعتمد على إخفاء الأزرار.

تم توحيد `AdminPermissionCode` على union مشتق من `ADMIN_PERMISSION_CODES` المركزي، دون إنشاء vocabulary ثانية. ترتيب overrides الحالي موثق كما هو: role defaults ثم كل override محفوظ، مع `allow` للإضافة و`deny` للإزالة؛ مفتاح قاعدة البيانات يمنع تكرار permission override نفسه.

تمت إضافة policy pure باسم `canRevokeSuperAdminSession`. يمنع repository، داخل transaction، إلغاء جلسة فردية أو كل جلسات آخر active Super Admin، بينما يسمح بذلك إذا بقي أكثر من Super Admin نشط. لم تُضف حالة lifecycle جديدة، ولم تُغيّر cookies أو auth architecture. هذا guard مكمل لحمايات demotion/disable/core-permission الموجودة.

تم توسيع read-only system health ليعرض حالة حماية Admin، وحالة migration registry دون تشغيل migrations، وعدد migrations المعروفة المطبقة/المعلقة، وحالة Site Experience مع أعداد draft/published، إضافة إلى database/storage/email/configuration. لا تُعرض secrets أو connection strings. عدم وجود `schema_migrations` يظهر كـ`requires_schema`، ووجود migrations ناقصة يظهر كـ`requires_migration`؛ لا يوجد أي auto-migrate.

## Validation checkpoint

بعد هذه التعديلات مرّ `pnpm typecheck` و`pnpm lint` و`pnpm test` محليًا. آخر نتيجة: **7 test files / 49 tests passed**. لم تُشغّل migrations، ولم تُستخدم قاعدة محلية، ولم تُنفذ أي Production mutation. ما زال يلزم إكمال frozen install وbuild وdiff/security review قبل commit أو deployment.

## Explicit limitations and boundaries

عقد audit الحالي يحتفظ actor/action/entity/field/timestamp ولا يملك outcome أو safe metadata مستقلة؛ لذلك لا تُدّعى قدرة تصفية success/failure. mutations الناجحة تسجل audit داخل transactions الحالية، أما denied/failure outcomes فليست projection منفصلة في schema الحالية، وإضافة ذلك تتطلب migration غير مصرح بها.

Email provider وstorage provider غير مهيئين، وتبقى حالتهما `Requires Configuration`. Admin identity UI لا ينشئ credentials ولا يدّعي activation؛ إنشاء الهوية يظل invited-only وفق العقد الحالي. migrations `0004` و`0005` و`0006` لا تزال **NOT APPLIED**، ولا توجد seeds أو accounts أو content writes. Population وPhase 17.5 وPhase 18 **NOT STARTED**.

## Site Experience boundary review

تمت مراجعة `AdminSiteExperiencePage` وجميع أغلفة resources (`settings`, `identity`, `appearance`, `homepage`, `navigation`, `footer`, `seo`, `profile_presentation`). الغلاف المركزي يقرأ Admin principal ثم يقيّم read/update/publish بحسب `siteExperienceAccess`، ويعرض read-only أو Requires Schema عند تعذر dependency؛ لذلك عدم وجود gate نصي داخل wrapper لا يمثل تجاوزًا. صفحة `/admin/homepage/preview` تتطلب `homepage.read`، تقرأ `draft` داخل Admin فقط، وتحمل `robots: noindex, follow: false`.

المسار العام (`app/layout.tsx`, homepage, robots) يستخدم `getPublishedResource` فقط مع timeout وfallback typed defaults. `getPublishedResource` لا يقرأ `draft`، ويعيد defaults عند غياب جدول `site_experience_configs` أو dependency failure. sitemap/robots لا تتضمن Admin/account/preview. Parser يرفض `javascript:`, `data:`, و`vbscript:` ويقبل internal paths وhttp(s) فقط، ولا توجد حقول raw HTML/CSS/JS في typed resources.

تمت مراجعة Admin GET/PATCH/publish routes: كل قراءة وم mutation تبدأ بـ authentication ثم permission، وmutations تحتفظ بـ same-origin guard قبل validation/repository؛ publish منفصل عن update. لا توجد عملية نشر عامة تلقائية للمسودة.

## Admin route sweep result

شمل sweep كل ملفات `app/admin/(protected)/**/page.tsx`. صفحات البيانات People/Categories/Profiles/Users/Admin entities/Audit/Sessions/System تستخدم gates server-side، بينما Site Experience wrappers تفوض gate إلى المكون المركزي. `/admin/content` أصبح shortcut permission-aware لا يعرض إلا مسارات القراءة المسموح بها ويرفض غياب أي صلاحية محتوى.

## Production read-only verification

بعد دفع commit `805336e778ee1117c8f770d1b978b803b9ebebe0` أصبح deployment `dpl_J58tjfNAyfU1Bwghu6v3Zb88Nmc8` بحالة `READY` على alias `https://a3-lam.vercel.app`. أُجريت طلبات GET فقط عبر `curl`، بلا cookies أو credentials وبلا POST/PUT/PATCH/DELETE.

| Route | Evidence |
|---|---|
| `/` | HTTP 200 |
| `/api/health` | HTTP 200 |
| `/categories` | HTTP 200 |
| `/robots.txt` | HTTP 200 |
| `/sitemap.xml` | HTTP 200 |
| `/api/admin/site-experience/homepage` | HTTP 401 |
| `/api/admin/people` | HTTP 401 |
| `/api/admin/profiles` | HTTP 401 |
| `/api/admin/sessions` | HTTP 401 |
| `/api/admin/users` | HTTP 401 |
| `/admin/people` | HTTP 200 after redirect to `/admin/login?next=%2Fadmin%2Fpeople` |
| `/admin/profiles` | HTTP 200 after redirect to `/admin/login?next=%2Fadmin%2Fprofiles` |
| `/admin/system` | HTTP 200 after redirect to `/admin/login?next=%2Fadmin%2Fsystem` |

هذه checks تثبت availability العامة وunauthenticated boundary فقط؛ لا تثبت صلاحيات حساب Admin مصادق ولا قياسات viewport/WCAG أو سلوك database-backed configurations في Production، ولم تُنفذ أي mutation.
