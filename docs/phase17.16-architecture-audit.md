# A3LAM — Phase 17.16 Architecture Audit

**التاريخ:** 26 أغسطس 2026

## Baseline

المستودع على `main`، وbaseline Phase 17.15 الموثق هو `3293b24aed4347120bc76d56f2214efe1e0973a7`. سيتم الحفاظ على branch policy وبدون force push أو reset أو rebase. Production migrations 0001–0006 موثقة كـAPPLIED؛ لا يطبق هذا التدقيق أي migration ولا ينفذ Production DML.

## الموجود

| المجال | الموجود فعليًا |
|---|---|
| Framework | Next.js App Router مخصص، وليس قالب tRPC/Vite العام |
| Database | PostgreSQL عبر Drizzle، schema مركزية في `lib/db/schema.ts` |
| Migration runner | `scripts/db-migrate.mjs` و`lib/db/migrations/runner.mjs`؛ transaction وadvisory lock و`schema_migrations` |
| Migration manifest | 0001–0006، وآخر ملف `0006_phase17_3_site_experience.sql` |
| Editorial People | جدول `people` يملك `image_url` nullable فقط، وعلاقات categories/occupations/sources/timeline/education |
| Professional Profiles | جدول `profiles` وعلاقات profile؛ `profile_files` مرتبط فقط بالـprofiles |
| Storage | `lib/storage/provider.ts` يملك `putObject()` وحالة `ready/requires_configuration`، ويقرأ ثلاثة env variables server-side |
| File validation | `lib/storage/validation.ts` يتحقق من الاسم والامتداد وMIME والـmagic bytes والحجم؛ لا يستخرج dimensions حاليًا |
| Admin auth/RBAC | `requirePermission` و`requirePermissionPrincipal` server-side؛ vocabulary الحالية تشمل `media.read` و`media.manage` فقط |
| Audit | `audit_logs` عام، وrepository يكتب audit rows داخل transactions للم mutations الحالية |
| Admin media | `/admin/media` محمي بـ`media.read` لكنه informational فقط؛ يعرض provider/count ولا يملك library CRUD |
| Public projection | published People فقط؛ Phase 17.15 أضاف safe URL projection وOG/JSON-LD image عند وجود رابط صالح |
| Portability | Docker، Compose، deployment، backup وrestore runbooks موجودة؛ Docker CLI verification غير متاح في sandbox |

## الناقص

تحتاج Editorial Person media إلى persistence مستقلة عن `profile_files`. لا يوجد حاليًا `media_assets` أو `person_media` attachment، ولا حقول width/height/alt/source/attribution/license/provider/key/status/visibility. لا توجد provider operations لـdelete/exists/read metadata، ولا typed distinction كاملة بين configured/unavailable/error. لا توجد Media Library list/search/metadata/usage/delete-safety UI.

## ما يجب إعادة استخدامه

يجب إعادة استخدام storage abstraction الحالية بدل إنشاء abstraction ثانية، وتوسيعها provider-neutrally. يجب إعادة استخدام `validateUpload` مع توسيعه لاستخراج dimensions للصور، وإعادة استخدام `requirePermission` و`media.read/media.manage`، و`audit_logs`، وsame-origin conventions، و`adminErrorResponse`، وtransaction patterns الموجودة في `adminRepository`.

`profile_files` لا يعاد استخدامه للشخصيات التحريرية لأنه يحمل foreign key إلى `profiles`. `people.image_url` يجب الحفاظ عليه مؤقتًا backward-compatible، لكن attachment الجديد يصبح المصدر canonical عند وجوده، مع عدم نسخ binary bytes أو base64 إلى PostgreSQL.

## ما يحتاج schema change

يحتاج الحل الصحيح migration additive جديدة بعد 0006، convention المقترح `0007_phase17_16_media_architecture.sql`. التصميم المبدئي يتكون من:

1. `media_assets`: asset metadata وstorage reference وdimensions وalt/source/attribution/license وstatus/visibility وcreated/updated actor fields.
2. `person_media`: relation بين `people` و`media_assets` مع `usage_type` و`is_primary`، unique partial index يسمح بصورة portrait أساسية واحدة للشخص، وforeign keys `ON DELETE RESTRICT` أو detach-safe semantics.

لا تحتوي الجداول على binary content أو secrets. migration يجب أن تكون additive وtransactional وبدون seed، وستبقى PENDING ولا تطبق Production في Phase 17.16.

## ما يحتاج provider configuration

الرفع الحقيقي، public delivery، delete، exists وmetadata verification تحتاج provider configured فعليًا. لا توجد credentials في sandbox أو Production scope الحالي، ولا يجوز إنشاء bucket أو تعديل Vercel secrets. لذلك يمكن بناء foundation وUI/API states واختبارها unit/in-memory، لكن لا يجوز ادعاء نجاح upload أو Production media readiness قبل external configuration.

## ما يمكن تنفيذه الآن بأمان

يمكن تنفيذ schema وmigration محليًا فقط، typed provider contract، metadata validation/dimension extraction، repository/API guards، admin library empty/configuration state، Person attachment UI، public projection rules، deletion safety، audit hooks، unit/auth/public regression tests، وdocumentation/portability runbooks. يمكن فحص Production GET/HEAD فقط بعد deploy. لا يجوز تطبيق migration أو رفع/حذف media في Production في هذه المرحلة.

## Stop conditions

إذا فشل migration المحلي أو اتضح conflict مع 0001–0006، أو احتاج الحل destructive DDL أو secret/provider/Vercel configuration أو Production SQL/upload، يتوقف التنفيذ ويُسجل `BLOCKED` أو `REQUIRES EXTERNAL CONFIGURATION` بدل workaround.
