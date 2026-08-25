# A3LAM — Phase 17.3 Architecture Audit

**الحالة:** Audit مكتمل مبدئيًا — Phase 17.3 implementation not started

**نطاق التدقيق:** الانتقال من Admin/RBAC foundation في Phase 17.2 إلى Admin Control Center وSite Experience Management، مع الحفاظ على الفصل بين Editorial Encyclopedia وProfessional Profiles، وعدم تنفيذ أي Production migration أو settings mutation دون موافقة صريحة مستقلة.

## 1. الوضع الحالي

المشروع يعمل على Next.js App Router وReact وTypeScript، مع REST Route Handlers وServer Components/Client Components. قاعدة البيانات PostgreSQL عبر Drizzle، والوصول إلى البيانات محصور في طبقات repositories/server modules. الهوية العامة للمستخدمين منفصلة عن Admin authentication، وتوجد حماية server-side عبر `requireAdmin` و`requirePermission`، مع RBAC مركزي وpermission overrides في Phase 17.2.

الحالة المرجعية الحالية هي commit Phase 17.2 على `main` مع deployment Production سابق بحالة READY. لا توجد حسابات أو بيانات seed جديدة. Migration `0004_phase17_1_admin_identity.sql` و`0005_phase17_2_rbac_management.sql` موجودتان في Git لكنهما غير مطبقتين محليًا أو على Production.

## 2. الأساسات القابلة لإعادة الاستخدام

| المجال | الأساس الحالي | قرار Phase 17.3 |
|---|---|---|
| Admin auth | Admin cookie وserver-side principal منفصلان عن public-user auth | يُحافظ عليه دون إعادة بناء |
| RBAC | `lib/admin/rbac.ts` مع role defaults وeffective overrides | تُضاف permissions فقط عند الحاجة، عبر نفس النظام |
| Admin HTTP | auth ثم permission ثم safe error mapping | إلزامي لكل mutation جديد |
| Audit | `audit_logs` مع actor/entity/action وبدون كشف old/new في projections العامة | تُستخدم كل تغييرات configuration أحداثًا audit-safe |
| Public editorial | `personService` و`databaseRepository` يعيدان published categories/people | لا يتغير publication gate |
| Professional profiles | `profileRepository` يطبق status/visibility/privacy projection | لا تملك إعدادات المنصة صلاحية تغيير خصوصية المستخدم |
| Public fallback | الصفحة الرئيسية تستخدم `withTimeout` وsafe empty/unavailable states | يجب أن تبقى configuration fetch bounded ولا تمنع rendering |
| SEO | `lib/seo/site.ts` وpage metadata و`app/sitemap.ts` و`app/robots.ts` | تُضاف defaults دون كسر explicit metadata أو public-only sitemap |
| Storage | `lib/storage/provider.ts` يعتمد external provider server-side ويصدر `StorageUnavailableError` | Media foundation provider-aware فقط، بلا filesystem/bytes/base64 |
| i18n/RTL | `lib/i18n/messages.ts` و`defaultLocale` و`dir=rtl` | كل UI جديد يمر عبر localization |

## 3. الحالة الحالية لتجربة الموقع

الصفحة الرئيسية في `app/page.tsx` مكوّنة من sections حقيقية: Hero، stats، SearchDiscovery، Featured People، Categories، وCTA/footer. النصوص تأتي من localization، بينما ترتيب sections ومحتواها البنيوي hard-coded. الفشل في تحميل البيانات يؤدي إلى fallback واضح بدل infinite loading.

`SiteHeader` يحتوي روابط ثابتة للرئيسية والاستكشاف والتصنيفات وعن أعلام، مع إجراءات الحساب بحسب public-user session. `SiteFooter` يحتوي brand وflat links وcopyright. لا توجد بعد persistence لإعدادات الهوية أو navigation أو footer groups أو social links.

المسارات `/admin/homepage` و`/admin/appearance` و`/admin/settings` و`/admin/seo` و`/admin/media` موجودة كواجهات foundation/status فقط، ولا تنفذ persistence. Dashboard الحالي يعرض counts حقيقية من repository عندما تتوفر، لكنه لا يعرض بعد system health المركب أو moderation queue أو quick actions permission-aware أو site-experience summaries.

## 4. الفجوات

لا يوجد model typed لإعدادات الموقع أو appearance أو homepage draft/published أو navigation/footer أو SEO defaults أو profile-presentation defaults. لا توجد APIs منظمة لهذه الموارد، ولا workflow موحد لـSave Draft وPreview وPublish، ولا preview route محمية وغير مفهرسة. لا توجد permission codes مستقلة لكل resource، ولا repository transaction موحدة للحفظ مع audit.

لا توجد media library persistence مستقلة؛ الموجود حاليًا هو storage upload abstraction المستخدم ضمن profile files. لذلك لا يجوز الادعاء بوجود upload/library operational قبل تحديد provider وschema وpermissions، ويمكن تنفيذ provider-aware read-only foundation فقط عند عدم توفر provider.

## 5. المتطلبات المعمارية المقترحة

إذا أثبت التنفيذ أن persistence الحقيقية مطلوبة، تستخدم migration تالية بعد فحص الترتيب الفعلي، ومن المتوقع أن تكون `0006_phase17_3_site_experience.sql` إن لم يظهر تعارض. يجب أن تكون additive، transactional where supported، deterministic، indexed، constrained، وقابلة للتدقيق، وتبقى **CREATED / NOT APPLIED** محليًا وProduction.

يفضل فصل الموارد بدل giant JSON blob: جدول typed لكل مورد أو جداول configuration version تحتوي `resource_type` مقيدًا وحقول draft/published الموثقة. يجب أن تكون القيم typed في TypeScript وvalidated server-side، مع `updated_by`, `updated_at`, `published_by`, `published_at` حيث يلزم. يمنع تخزين secrets، API keys، tokens، passwords، raw HTML، raw CSS، أو raw JavaScript.

القراءة العامة تكون من published configuration فقط، مع fallback آمن إلى defaults الحالية عند غياب السجل أو timeout أو malformed data. قراءة draft لا تكون public، ولا تدخل sitemap أو metadata العامة. Preview يكون Admin-authenticated وnoindex، ولا يغير التجربة العامة عند فتح المحرر.

## 6. حدود المنتج

يجب أن تبقى مناطق Admin منفصلة وواضحة: Editorial للمحتوى والشخصيات والتصنيفات، Professional للمستخدمين والملفات والظهور، Platform لإعدادات الموقع والمظهر والصفحة الرئيسية والتنقل وSEO والوسائط. لا تبدأ هذه المرحلة Population أو Phase 17.4 أو Phase 18 أو AI أو analytics أو external integrations أو Email/Storage provider setup.

## 7. الآثار الأمنية والخصوصية

كل mutation يتبع الترتيب: authentication ثم permission ثم validation ثم business logic/persistence ثم audit ثم safe response. يجب منع IDOR عبر تحميل المورد بعد gate المناسب والتحقق من صلاحية المورد، مع الإبقاء على same-origin guard للم mutations. يجب فحص protocol في جميع الروابط ومنع `javascript:`, `data:`, و`vbscript:`، وعدم السماح بأي HTML/CSS/JS تنفيذي.

إعدادات profile presentation هي platform defaults فقط؛ لا تغير `emailPublic`, `phonePublic`, `visibility` أو أي privacy preference للمستخدم. يجب ألا تُعاد hashes أو tokens أو private profile fields في Admin APIs أو audit payloads. تغيير robots الخطير مثل Disallow all يحتاج permission عالية وتأكيدًا قويًا وaudit.

## 8. قرار التنفيذ

سيُنفذ Phase 17.3 تدريجيًا فوق هذه الأساسات، مع البدء بنموذج typed وvalidation وmigration design قبل الواجهات. سيبقى أي provider غير مضبوط بحالة **REQUIRES CONFIGURATION**، وستبقى أي migration جديدة **CREATED / NOT APPLIED**. لا تُستخدم قاعدة محلية غير متاحة، ولا تُنشأ accounts أو seed أو content، ولا يُنفذ أي Production POST/PUT/PATCH/DELETE أو migration.

**حالة التدقيق:** مكتمل كمرجع pre-implementation. الخطوة التالية هي تثبيت schema/validation contracts ثم تنفيذ persistence المحلية الموثقة فقط.

## 9. نتيجة مراجعة التنفيذ الأمنية

تم تنفيذ Route Handlers منفصلة لـGET/PATCH وPOST publish، وكل mutation يحافظ على same-origin check وserver-side Admin authentication وresource-specific permission gate وtyped validation قبل transaction. الموارد غير المعروفة تُرفض دون target lookup، ولا تُعاد أي hashes أو tokens أو private profile fields.

تمت إضافة database-level resource allow-list إلى migration 0006، كما أن validator الداخلي يرفض البروتوكولات غير الآمنة ويزيل الحقول غير المعروفة من payload. لم يُسمح بإدخال raw HTML أو CSS أو JavaScript. إدارة navigation/footer تستعمل عناصر typed وروابط validated، وprofile presentation يطبق platform defaults فقط ولا يكتب إلى ownership أو privacy fields.

تمت مراجعة fallback: public readers تعود إلى defaults الحالية عند غياب `site_experience_configs` أو حدوث timeout/invalid configuration، بينما Admin editor يعرض Requires Schema أو dependency-safe error ولا يتظاهر بأن persistence متاحة. تم تحسين AdminShell ليحمّل effective permissions مرة واحدة ويفشل مغلقًا عند تعذر RBAC dependency.

التحقق المرحلي بعد هذه المراجعة: `pnpm typecheck` و`pnpm lint` و`pnpm test` كلها PASS، مع 47 اختبارًا عبر 7 ملفات. لا يوجد local database متاح، ولم تُشغّل `pnpm db:migrate`.

**حدود معلنة:** لا يوجد provider خارجي للبريد أو التخزين ضمن هذه المرحلة؛ media upload/library remains REQUIRES CONFIGURATION، والمigration 0006 CREATED / NOT APPLIED. القياسات الخارجية لـWCAG وscreen readers ومصفوفة المتصفحات والمقاسات الدقيقة لا تُدّعى PASS دون evidence مستقل.

## 10. Local read-only smoke evidence

في الخادم المحلي المبني، أعادت `/` و`/api/health` و`/robots.txt` و`/sitemap.xml` الحالة 200، بينما أعادت مسارات Admin غير الموثقة redirect إلى `/admin/login` بدل كشف المحتوى. الفحص النصي للصفحة العامة لم يجد markers للأسرار أو hashes/tokens أو arbitrary configuration fields. أظهر الفحص البصري أن RTL وnavigation العامة والمحتوى fallback تعمل، مع بقاء catalog unavailable لأن قاعدة البيانات المحلية غير مهيأة؛ وهذا متوقع ولم تُنشأ أي بيانات محلية.

## 11. Final local validation snapshot

بتاريخ 2026-08-25 تم تنفيذ `pnpm install --frozen-lockfile` باستخدام pnpm 11.21.0، ثم `pnpm typecheck` و`pnpm lint` و`pnpm test` و`pnpm build` و`git diff --check`. جميعها PASS. نتيجة Vitest: **48 tests عبر 7 test files**. أظهر build مسارات Admin الجديدة وAPI routes الجديدة ضمن Next.js 16.3.1. لم يُشغّل `pnpm db:migrate` ولم تُنشأ أي بيانات أو حسابات أو أسرار.
