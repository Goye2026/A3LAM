# Phase 17.0 — تقرير التدقيق المعماري الأولي

**التاريخ:** 2026-08-25  
**المشروع:** A3LAM | أعلام  
**نطاق التدقيق:** Admin Control Center وRBAC وواجهات التحكم الآمنة فقط.

## القيود المؤكدة

لم تُنشأ أو تُعدّل أو تُحذف أي بيانات، ولم تُنشأ حسابات أو seed data أو fake content، ولم تُطبق أي migration على Production. لم يبدأ Population أو Phase 18. ستبقى مصادقة Admin مستقلة عن user auth، ولن تُقرأ أو تُعرض secrets.

## المعمارية الحالية

التطبيق Next.js App Router مع server components/client components وREST route handlers، وPostgreSQL عبر postgres.js وDrizzle. مصادقة Admin الحالية تعتمد على `A3LAM_ADMIN_ACCESS_TOKEN` وجلسة HMAC موقعة في cookie `a3lam_admin_session`. لا يوجد حاليًا admin identity persisted أو roles/permissions أو session revocation store. يجب الحفاظ على هذا النموذج وعدم دمجه مع `a3lam_user_session`.

## الموجود والقابل لإعادة الاستخدام

| المجال | الموجود حاليًا |
|---|---|
| Admin shell | `AdminShell` مع sidebar بسيط ومسارات dashboard/people/categories/add person/home/logout. |
| Page authorization | `requireAdminPage()` server-side، يحول غير المصرح إلى `/admin/login`. |
| API authorization | `requireAdmin()` server-side في مسارات Admin، مع error taxonomy آمنة. |
| Editorial people | `adminRepository` يدعم dashboard counts، قائمة paginated مع query/status، editor data، create/replace، transitions، وcategory options. |
| Editorial categories | CRUD إنشاء/تعديل وقائمة options مع validation وunique slug وحماية FK الحالية. لا يوجد deletion حاليًا. |
| Professional profiles | `/admin/profiles` وdetail وmoderation transitions وaudit logs موجودة، مع filters client-side سبق تنفيذها في Phase 16.0. |
| Audit | جدول `audit_logs` موجود ويُستخدم حاليًا لانتقالات professional profiles، لكن editorial/category changes لا تكتب audit events حاليًا. |
| Schema | جداول people/categories/profiles/users/sessions/files/audit موجودة. لا يوجد admins/editors/permissions/settings/homepage/appearance/media index/SEO settings. |
| Public privacy | الإسقاط العام المهني server-side ويمنع البيانات الخاصة والحالات غير المنشورة. يجب عدم إضعافه. |
| Storage | provider خارجي مع metadata في DB فقط؛ لا filesystem ولا bytes/base64. |
| Existing tests | Vitest tests تشمل auth/profile/privacy/upload/domain/admin أساسيات؛ لا توجد تغطية RBAC أو routes الجديدة. |

## الفجوات الأساسية

1. لا توجد permission vocabulary مركزية أو role-to-permission mapping. كل Admin session صالح حاليًا يمتلك نفس صلاحية الوصول.
2. لا توجد هوية Admin persisted أو إدارة administrators/editors/users، ولا يمكن تنفيذ create/disable/revoke sessions دون schema وauth design جديد.
3. لوحة Admin الحالية editorial people-centric ولا تعرض counters حقيقية للمستخدمين أو profile moderation أو categories أو system status.
4. لا توجد طبقات persistence typed لإعدادات الموقع أو homepage/appearance/SEO. إضافة draft/preview/publish للإعدادات غالبًا تتطلب schema، ولذلك يجب تصميمها وتوثيقها قبل أي migration وعدم تطبيقها على Production.
5. لا توجد Media management repository عامة؛ التخزين الحالي خاص بملفات profile owner ولا يعرّف listing/deletion provider operation.
6. Audit infrastructure لا تغطي بعد category/person/config/role/user actions، ويجب توسيع نفس النظام بدل إنشاء سجل ثانٍ. بعض الأحداث تتطلب actor identity غير متاحة في auth الحالية.

## قرار معماري أولي

يمكن تنفيذ Control Center foundation migration-free جزئيًا عبر: توسيع AdminShell وdashboard، إضافة permission vocabulary وserver-side policy على مستوى جلسة Admin الحالية، route registry typed، وتحسين existing people/profiles/categories pages. لكن RBAC الحقيقي متعدد الأدوار، إدارة administrators/editors/users، والإعدادات الدائمة draft/preview/publish لا ينبغي تمثيلها ببيانات وهمية أو JSON غير typed أو frontend-only checks.

إذا كان إكمال معايير Phase 17 يتطلب persisted Admin roles أو settings tables، فسيتم تصميم migration محليًا فقط ثم **STOP قبل Production migration** وفق التعليمات. لا يجوز الادعاء بإدارة roles أو settings أو counters غير موجودة فعليًا.

## نطاق التنفيذ المقترح بعد استكمال التدقيق

سيُعطى الأولوية لإعادة استخدام المسارات الحالية وبناء أساس Control Center صادق: dashboard operational بحالات unavailable، sidebar grouped، RBAC policy قابلة للتوسيع ومطبقة server-side على ما يمكن دعمه دون schema، تحسين moderation/category/people navigation، وتوثيق العناصر غير القابلة للتنفيذ بأمان كـDEFERRED أو BLOCKER. لا تُنشأ صفحات placeholder توحي بعمل backend غير موجود إلا إذا وُسمت بوضوح بأنها Coming Soon/Requires Configuration.

## عناصر مؤجلة أو تحتاج تفويضًا/Schema

إدارة persisted administrators/editors/users، role escalation protection الكامل، final Super Admin rule، session revocation، user suspension، typed persistent settings، homepage builder persistence، appearance persistence، SEO settings persistence، media listing/deletion، وaudit actor identity كلها تحتاج إما schema/auth provider extension أو قرارًا صريحًا. لن يتم تجاوز ذلك عبر client-only permissions أو JSON dumping ground أو fake counters.

## نتيجة التدقيق الحالية

**المرحلة:** Audit in progress.  
**Population:** NOT STARTED.  
**Phase 18:** NOT STARTED.  
**Production mutations:** NOT PERFORMED.

## تفاصيل إضافية بعد فحص الطبقات

`adminRepository` هو المصدر الحالي لعمليات المحتوى التحريري. يوفر dashboard قائمًا على حالات people، وقائمة people paginated بمرشحي query/status فقط، وcategory options، وإنشاء/استبدال السجلات، وانتقالات editorial lifecycle. عملية `replaceRecord` transactional وتحافظ على FK الحالية، لكن repository لا يحتوي على users/admins/roles/permissions/settings أو استعلام audit عام، كما أن بعض hydration loops للتاريخ/التعليم قد تتحول إلى N+1 مع تضخم البيانات ويجب عدم توسيعها بلا pagination أو aggregation.

`AdminShell` الحالي يحتوي أربعة روابط فقط ولا يوفر active state أو مجموعات أو breadcrumbs. `AdminProtectedLayout` يطبق حماية الصفحة وnoindex، بينما API routes تستعمل `requireAdmin` القائم على cookie. صفحة dashboard الحالية تعرض totals وحالات people وrecent people فقط، مع حالة unavailable عند فشل DB.

في schema، `userAccounts` و`userSessions` تخصان user auth المستقلة، و`userAccounts.role` محدود إلى `user|admin` ولا يمثل Admin RBAC المطلوب. `auditLogs` عام من حيث entity/action لكنه يستخدم حاليًا أساسًا لانتقالات profile، ولا توجد جداول Admin identities أو roles/permissions أو site settings. FK للتصنيفات تستخدم `onDelete: restrict` من people وprofiles، لذلك حذف category غير موجود حاليًا وهو القرار الآمن.

النتيجة: توجد قاعدة قوية لتوسيع Admin UX والمحتوى وprofile moderation، لكن استيفاء RBAC متعدد الأدوار وإدارة administrators/editors وsettings persistence يتطلب قرار schema/auth صريحًا. لن تُستخدم `userAccounts.role` كبديل صامت لـAdmin roles.

## تحديث بعد التنفيذ

أضيفت `lib/admin/rbac.ts` بمفردات roles/permissions وmapping مركزي، وأضيف `requirePermission` إلى HTTP layer. جميع Admin mutation routes الحالية أصبحت تستخدم permission gates المناسبة: people create/update/publish، categories create/update، profiles read/moderate/publish. لا يزال principal الفعلي الوحيد هو الـAdmin session token الحالي، ويُعامل كـ`SUPER_ADMIN` مؤقتًا لأن schema لا يحتوي على Admin identity.

أضيفت aggregation حقيقية لـControl Center تشمل people/categories/users/profiles، واستُخدمت في dashboard مع حالات unavailable. أضيفت users read-only summaries بفلتر الاسم وحالة profile دون البريد أو passwordHash أو session data، وaudit read-only metadata. أضيفت category summaries مع related people/profile counts، وpeople category filter/server-side sorting.

أضيفت مسارات `/admin/administrators`, `/admin/editors`, `/admin/content`, `/admin/homepage`, `/admin/appearance`, `/admin/media`, `/admin/seo`, `/admin/settings`, و`/admin/system`. المسارات التي تحتاج persisted schema تعرض Requires schema configuration بوضوح ولا تنفذ backend وهميًا. تمت إضافة i18n عربية/إنجليزية وأنماط RTL/responsive مشتركة.

أضيفت audit events transactional لإنشاء/تعديل/انتقال people وإنشاء/تعديل categories، مع إعادة استخدام `audit_logs` الحالي. لم يتغير schema ولم تُطبق migrations. بقيت الإدارة الفعلية للـAdmin identities وsession revocation وsettings persistence وmedia registry مؤجلة.

**حالة التدقيق النهائية:** أساس Control Center migration-free منفذ، مع PASS WITH LIMITATION للـRBAC متعدد الأدوار وإدارة identities لأنها تحتاج schema/auth design إضافيًا.
