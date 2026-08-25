# Phase 17.0 — Admin Control Center Architecture

## القرار التنفيذي

سيُوسَّع مركز التحكم فوق `AdminShell` و`requireAdminPage` و`requireAdmin` و`adminRepository` الحالية. ستبقى مصادقة Admin المستقلة القائمة على `A3LAM_ADMIN_ACCESS_TOKEN` دون تغيير، كما ستبقى user auth القائمة على `a3lam_user_session` منفصلة تمامًا. لن تُستخدم `userAccounts.role` كبديل صامت لأدوار Admin.

## RBAC vocabulary

| الدور | المعنى | الحالة في Phase 17.0 |
|---|---|---|
| `SUPER_ADMIN` | صلاحية كاملة، مع حماية العمليات الحساسة | ممثل فعليًا فقط بالـAdmin token الحالي؛ لا توجد هوية persisted. |
| `ADMIN` | إدارة تشغيلية واسعة دون صلاحيات Super Admin الحساسة | معرف مركزيًا، لكن يحتاج Admin identity persistence قبل التفعيل. |
| `EDITOR` | تحرير المحتوى المعين وإرساله للمراجعة | معرف مركزيًا، لكن يحتاج هوية/نطاق assignment persisted. |
| `MODERATOR` | مراجعة الملفات والمحتوى ضمن الصلاحية | معرف مركزيًا، لكن يحتاج هوية/نطاق persisted. |
| `USER` | مستخدم المنصة العادي | يبقى ضمن user auth ولا يرث صلاحيات Admin. |

## Permission vocabulary

الصلاحيات مركزية في `lib/admin/rbac.ts`، وتشمل: `users.read`, `users.manage`, `users.suspend`, `admins.read`, `admins.manage`, `editors.read`, `editors.manage`, `people.read`, `people.create`, `people.update`, `people.publish`, `profiles.read`, `profiles.moderate`, `profiles.publish`, `categories.read`, `categories.create`, `categories.update`, `homepage.read`, `homepage.update`, `appearance.read`, `appearance.update`, `media.read`, `media.manage`, `seo.read`, `seo.update`, `audit.read`, `system.read`, و`settings.manage`.

| الدور | مجموعة الصلاحيات المقترحة |
|---|---|
| `SUPER_ADMIN` | جميع الصلاحيات. |
| `ADMIN` | users/admins/editors manage، people، profiles، categories، homepage، appearance، media، seo، audit، system، دون قواعد Super Admin النهائية. |
| `EDITOR` | people.read/create/update، profiles.read، categories.read، وsubmission للمراجعة عندما يدعمه نطاق المحتوى. |
| `MODERATOR` | people.read، profiles.read/moderate، audit.read ضمن نطاق المراجعة. |
| `USER` | لا Admin permissions. |

حتى تتوفر هوية Admin persisted، يُعامل الطلب الذي يمر من session token الحالي كـ`SUPER_ADMIN` فقط. هذا يحقق gate مركزيًا ولا يدّعي دعم أدوار متعددة غير موجودة في قاعدة البيانات. أي شاشة تتطلب هوية Admin متعددة أو session revocation ستعرض `Requires configuration` بدل تنفيذ وهمي.

## Admin route structure

| المسار | الوظيفة | القرار |
|---|---|---|
| `/admin` | Dashboard تشغيلي | موجود ويُوسَّع مع counters حقيقية وحالات unavailable. |
| `/admin/people` و`/admin/people/[id]` و`/admin/people/new` | Editorial people | موجود ويُعاد استخدامه. |
| `/admin/categories` | Category management | موجود ويُعاد استخدامه، دون حذف unsafe. |
| `/admin/profiles` و`/admin/profiles/[id]` | Professional moderation | موجود ويُعاد استخدامه. |
| `/admin/users` | User summaries read-only | قابل للتنفيذ من الجداول الحالية دون كشف password/session. suspension/revoke مؤجل. |
| `/admin/administrators` | Admin identity management | route foundation فقط؛ يحتاج persisted Admin schema. |
| `/admin/editors` | Editor management | route foundation فقط؛ يحتاج persisted Admin schema/assignments. |
| `/admin/content` | Unified content entry | foundation navigation؛ لا duplicate CMS. |
| `/admin/homepage` | Typed homepage control foundation | safe status/preview explanation؛ persistence مؤجل لحين settings schema. |
| `/admin/appearance` | Constrained token controls | UI foundation فقط؛ لا arbitrary CSS، persistence مؤجل. |
| `/admin/media` | Storage foundation | read-only metadata/status عند provider support؛ لا filesystem fallback. |
| `/admin/seo` | Structured SEO controls | foundation documentation؛ لا scripts أو HTML injection. |
| `/admin/audit` | Existing audit log read-only | قابل للتنفيذ من `audit_logs` مع redaction. |
| `/admin/system` | Dependency/status visibility | safe unavailable state، دون secrets. |
| `/admin/settings` | Typed settings boundary | لا arbitrary JSON؛ persistence مؤجل. |

## Schema decision

لا توجد migration في هذا الجزء من التنفيذ ما لم يثبت الاحتياج أثناء التطبيق. الاستيفاء الكامل لإدارة Admins/Editors وrole assignments وsettings draft/preview/publish وmedia registry يحتاج جداول جديدة، وربما actor identity في audit. إذا أصبح ذلك لازمًا، تُصمم migration وتُختبر محليًا فقط، ثم يتوقف العمل قبل أي Production migration.

## Audit decision

سيُعاد استخدام `audit_logs` الحالي بدل سجل ثانٍ. لا تُحفظ secrets أو request bodies الحساسة. إلى أن تتوفر هوية Admin persisted، تستخدم أحداث Admin الحالية `actorType=admin_session` و`actorId=null` مع action/entity/result آمنين.

## حدود صريحة

لا AI، ولا semantic search، ولا analytics، ولا email provider، ولا contact backend، ولا external integrations، ولا arbitrary CSS/JS، ولا unrestricted page builder، ولا automated population، ولا Production seed data، ولا fake accounts/people/CVs، ولا Phase 18.
