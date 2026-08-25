# A3LAM — Phase 17.1 Audit

**التاريخ:** 2026-08-25  
**النطاق:** Admin Identity, RBAC & Permission Management فقط.

## Current architecture

المشروع هو Next.js App Router مع REST route handlers، PostgreSQL عبر postgres.js وDrizzle، ومصادقة Admin مستقلة عن user auth. المصادقة الإدارية الحالية تعتمد على `A3LAM_ADMIN_ACCESS_TOKEN` وتصدر cookie موقعة stateless باسم `a3lam_admin_session`. لا توجد حاليًا هوية Admin persisted أو role lookup أو سجل Admin sessions قابل للإبطال.

مصادقة المستخدم مستقلة تمامًا، وتستخدم `a3lam_user_session` مع token hash في `user_sessions` وrevocation server-side. لا يجوز استخدام user auth للوصول إلى Admin APIs أو استخدام Admin session بدل user session.

## Existing Phase 17.0 foundation

`lib/admin/rbac.ts` يعرّف roles وpermissions وmapping مؤقتًا، ويعامل Admin token الحالي كـ`SUPER_ADMIN` لغياب Admin identity schema. `requirePermission` مطبق على المسارات الإدارية التحريرية. `audit_logs` هو سجل التدقيق الوحيد، وواجهات Control Center الحالية تعيد summaries وmetadata آمنة فقط.

## Confirmed gaps

| capability | current state | Phase 17.1 decision |
|---|---|---|
| Persisted Admin identity | غير موجود | يحتاج schema جديدًا؛ سيُنفذ محليًا فقط إذا كان ذلك ضروريًا. |
| Persisted roles/permissions | غير موجود | يحتاج جداول normalized أو سياسة typed؛ لا تستخدم `userAccounts.role` كبديل. |
| Admin sessions | stateless HMAC فقط | يحتاج session table وauth lookup؛ لا يمكن ادعاء revoke قبل تنفيذه. |
| Admin/Editor CRUD | صفحات foundation فقط | يحتاج API/repository وidentity credential flow آمن. |
| Invitation/email flow | غير موجود | يبقى DEFERRED؛ لا Email Provider أو password مؤقتة مكشوفة. |
| Last Super Admin protection | policy pure function فقط | يحتاج enforcement transaction على persisted identities. |
| Audit actor identity | `actorId` حاليًا null لبعض الأحداث | يحتاج ربطًا بالـAdmin identity عند تنفيذ schema. |
| Permission Matrix UI | policy موجودة، لا إدارة persisted | يمكن عرض matrix حقيقية؛ الحفظ يحتاج role-permission persistence. |

## Safety boundary

لا توجد حسابات أو بيانات Production جديدة، ولا migrations Production تلقائية، ولا تغييرات في secrets أو auth cookie names، ولا population. إذا تطلبت Phase 17.1 migration، ستُنشأ وتُختبر محليًا وتوثق، ثم يتوقف التنفيذ قبل Production migration.

## Recommended implementation

أفضل مسار هو توسيع النظام الحالي لا استبداله: إضافة Admin identity/session tables normalized، repository واحد داخل `lib/data/adminRepository.ts` أو طبقة Admin data واضحة، تحويل principal resolution إلى server-side lookup، إبقاء legacy token كمسار bootstrap محافظ لا يمنح امتيازًا جديدًا غير موثق، ثم إضافة APIs/واجهات Admin management وsession revocation وpermission matrix. يجب أن تظل البيانات الحساسة server-side ولا تظهر في summaries أو responses.

## Scope classification

**PASS:** architecture reuse، فصل user/Admin auth، عدم وجود fake data، existing permission vocabulary.  
**REQUIRES MIGRATION:** persisted Admin identities، sessions، roles/permissions، role assignments، audit actor linkage.  
**DEFERRED:** Email Provider/invitation delivery، arbitrary integrations، Population، Phase 17.2/17.3/17.4، AI، analytics، QR، semantic search، contact backend، page builder.  
**BLOCKED UNTIL APPROVAL:** أي Production migration أو إنشاء أول Admin identity داخل Production.

## Schema decision

تحتاج Phase 17.1 إلى migration جديدة `0004_phase17_1_admin_identity.sql` لإضافة `admin_identities`, `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_role_assignments`, `admin_sessions`، وإضافة `user_accounts.disabled_at`. الـmigration transactional عبر runner الحالي، ولا تحتوي seed أو حسابات أو بيانات محتوى. تم إبقاء role assignment في جدول واحد لكل identity لتجنب principal غير حتمي. role/permission policy الحالية تبقى typed في التطبيق إلى أن تُعتمد آلية catalog persistence؛ لذلك لا تُعرض واجهة تدّعي حفظ checkbox مخصص قبل وجود صفوف وصلاحيات persisted.

**Production status:** لم تُطبق migration على Production، ولن تُطبق تلقائيًا ضمن هذه المرحلة وفق المواصفة. يتطلب ذلك تصريحًا مستقلًا، نافذة تشغيل، وخطة bootstrap آمنة لأول Super Admin دون تغيير المحتوى أو secrets.
