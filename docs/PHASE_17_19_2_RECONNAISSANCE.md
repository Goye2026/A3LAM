# A3LAM — Phase 17.19.2 Reconnaissance

**الحالة:** اكتمل التدقيق الأولي؛ لم يُعدّل كود Phase 17.19.2 بعد هذا التدقيق.

## مصدر الحقيقة التقني

المشروع الحالي هو تطبيق Next.js 16.3.1 App Router باستخدام React 19.2.8 وTypeScript 6.0.2 وNode.js 22.13.0 وpnpm 11.21.0. يعتمد على TypeScript/React في الواجهة والخادم، Drizzle ORM وpostgres-js مع PostgreSQL، وVitest 4.1.11 للاختبارات. لا توجد حاجة لإعادة تهيئة أو replatform إلى Vite أو PHP أو WordPress runtime.

الحالة المستقرة عند بدء التدقيق هي `HEAD == origin/main == 4a15628d2d99851ffa3b97ff7b9544e21edd9d9a` وworking tree نظيف.

## Routing وAdmin protection

التطبيق يستخدم App Router. المسارات العامة القائمة تشمل `/`, `/categories`, `/categories/[slug]`, `/search`, `/person/[slug]`, `/sitemap.xml`, و`/robots.txt`. المسارات الإدارية تشمل People وCategories وProfiles وMedia وAppearance/Site Experience وUsers وRoles/Permissions وAudit وSystem وAI. مسارات Admin محمية عبر layout الخادم و`requireAdminPage()`، كما أن API mutation routes تعيد التحقق من authentication وRBAC وsame-origin وpayload validation حسب العقد الحالي.

## Persistence الفعلية

جرد `lib/db/schema.ts` يثبت وجود جداول categories وpeople وعلاقاتها، sources وperson_sources، timeline_events وeducation وعلاقات المصادر، user_accounts وuser_sessions، admin identities/roles/permissions/assignments/overrides/sessions، site_experience_configs، profiles وعلاقاتها المهنية، audit_logs، profile_files، media_assets وperson_media، وكيانات AI المعزولة.

لا توجد جداول pages أو posts أو tags أو widgets أو menus أو themes أو sidebars. بناءً على ذلك، لا يجوز إنشاء persistence جديدة لمجرد محاكاة WordPress. سيتم استخدام registry/configuration الحالي حيث يكفي، وتبقى المفاهيم غير المدعومة صريحة كـNot Available/Requires Configuration. أي migration لاحقة، إن أثبتها requirement حقيقي، يجب أن تكون additive ومكتوبة فقط وغير مطبقة في Production.

## Content capabilities

`lib/data/adminRepository.ts` يوفّر listing حقيقيًا ومحدودًا لـPeople مع search/status/category/sort/pagination/readiness، ويقرأ category options وcategory summaries. يوفر أيضًا create/update category، create/replace Person، status transition، وaudit logging داخل transactions. Person editor في `AdminPersonForm.tsx` domain-specific ويغطي identity والbiography/categories/sources/timeline/education/media/lifecycle/unsaved state. لذلك لا حاجة إلى generic post mutation endpoint.

صفحة People الحالية تنفذ list-table UX فعليًا: filters وsort وpagination وrow actions وstatus/readiness/empty/error states. صفحة Content الحالية hub تنقلك إلى People/Categories/Profiles، وليست generic page manager.

## Media

`lib/media/repository.ts` يدعم listing محدودًا مع query/status/visibility، usage references إلى People، create/attach/update/detach/archive، public/private projection، وحماية archive عند وجود attachments. `MediaLibraryClient.tsx` يعرض grid searchable/filterable مع metadata وusage وlicense/source وحالات schema/provider/empty/error. upload لا يُفعل إذا لم يكن provider configured؛ لا توجد واجهة upload وهمية.

## Appearance/navigation

`lib/site-experience/config.ts` وrepository يدعمان resources فعلية لـsettings وidentity وappearance وhomepage وnavigation وfooter وSEO وprofile presentation، مع draft/published behavior وsafe URL parsing. Appearance لا يسمح حاليًا إلا بثيم light وtypography/config allowlists. Navigation/footer عبارة عن flat arrays قابلة للتحرير والترتيب، وليست nested menu persistence. لا توجد Widgets persistence.

Phase 17.19.1 أضافت `lib/cms/*` declarative registries، `AdminDesignSystem`، `AdminSidebar`، و`SiteFrame`. يجب توسيع هذه الطبقات دون تجاوز backend contracts أو إنشاء parallel permission system. AI Workspace يبقى domain منفصلًا عن CMS.

## القرار التشغيلي للمرحلة

الأولوية هي تعميق التجربة الوظيفية فوق People/Categories/Profiles/Media/site-experience الموجودة، وتحسين discovery/list/editor/shell حيث يمكن ذلك بأمان. Page/Post/Tag/Widget/Menu/Theme persistence لا تُفترض. يجب أن تعرض الواجهة capabilities الحقيقية فقط، وأن تستخدم statuses صادقة بدل fake buttons/counters.

Production يبقى GET/HEAD-only للتحقق النهائي. لا تُستخدم `DATABASE_URL` المحلية أو الإنتاجية لهذا التدقيق، ولا تُنفذ migrations أو seeds أو provider/OCR/AI calls أو population.
