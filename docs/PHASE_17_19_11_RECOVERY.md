# PHASE 17.19.11 — RECOVERY PLAN

## Current decision

`BLOCKED — REQUIRES EXPLICIT AUTHORIZATION / INFRASTRUCTURE`.

هذه الوثيقة خطة تنفيذ مستقبلية وليست تصريحًا أو تنفيذًا. لا توجد حاليًا Production DB authorization، ولا valid database read-only channel، ولا isolated PostgreSQL، ولا backup/snapshot confirmation.

## Required gates

لا يبدأ أي Production mutation إلا إذا أصبحت كل القيم التالية مثبتة بالأدلة:

| Gate | Required state | Current state |
|---|---|---|
| `BACKUP_CONFIRMED` | true with restore evidence | NOT_CONFIRMED |
| `ISOLATED_REHEARSAL` | PASS | NOT_AVAILABLE |
| `MIGRATION_ORDER` | VERIFIED from registry | NOT_OBSERVABLE |
| `DATA_COMPATIBILITY` | PASS from safe checks | NOT_OBSERVABLE |
| `NO_DESTRUCTIVE_OPERATION` | explicitly reviewed | NOT_CONFIRMED؛ 0008–0010 replace permission constraints |
| `ROLLBACK/RECOVERY PLAN` | confirmed and tested | PLAN ONLY |
| `AUTHORIZATION` | explicit production approval | NOT_AVAILABLE |

إذا بقي أي gate `false`, `NOT_TESTED`, `NOT_OBSERVABLE`, أو `UNKNOWN` فالقرار **BLOCKED**.

## Recommended future path

1. احصل على snapshot/provider backup مشفر وقابل للاستعادة، وسجل identifier غير حساس ووقت النسخ.
2. أنشئ clone أو staging PostgreSQL منفصلًا، وليس Production كبيئة اختبار.
3. أدخل snapshot/representative data/migration history إلى البيئة المعزولة حسب الصلاحيات.
4. افحص `information_schema`, `pg_catalog`, و`schema_migrations` read-only، وقارنها مع `lib/db/schema.ts` وmanifest.
5. افحص orphans، duplicate unique values، nullability، FKs، constraints، status values، وlegacy media alternatives دون تعديل rows.
6. شغّل native runner على clone فقط وبالترتيب الكامل، وتوقف عند أول migration failure أو inconsistent history.
7. شغّل integration/repository tests وhomepage/person/CMS runtime checks ضد clone.
8. بعد PASS مستقل، اطلب Production approval منفصلًا ومحددًا.
9. على Production، استخدم native ordered runner فقط، ولا تستخدم `drizzle-kit push` أو manual SQL أو manual history marking.
10. بعد كل migration، تحقق من objects وregistry والـruntime، وتوقف عند أي mismatch.

## Migration recommendation

المرشح الأول للتحقيق هو `0007_phase17_16_media_architecture.sql` بسبب runtime evidence الخاص بـ`person_media`. لا يجوز تطبيق 0007 مباشرة قبل معرفة هل 0001–0006 مطبقة. لا يجوز القفز إلى 0010، ولا تعديل migration history يدويًا.

## Homepage/person recovery validation

لا تُعتبر Homepage restored إلا إذا نجحت فعليًا: DB availability، catalog query، Person projection، PersonCard render، media projection أو legitimately empty، غياب schema errors، وغياب private data. كما يجب أن يعرض `/person/[known-valid-slug]` سجلًا منشورًا مثبتًا من DB/read-only evidence، لا slug مخمنًا أو fake profile.

لا تُعتبر CMS functioning إلا بعد إثبات Admin route/auth/RBAC/API/persistence/editor/revision/media picker/no-fake-state في بيئة مصرح بها. Authenticated browser QA يحتاج session حقيقية؛ anonymous smoke لا يعوضه.

## Rollback/recovery

DDL chain لا تملك rollback عامة تلقائية موثوقة. عند failure، أوقف runner ولا تتجاوز migration ولا تعدل `schema_migrations` لإخفاء الخطأ. استعد من snapshot إلى clone أولًا، ثم قرر provider-approved restore أو forward-fix بعد incident review. لا تنفذ `DROP`, reset، أو reverse SQL ارتجاليًا على Production.

> DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION

## Explicit non-actions in this phase

لم تُنفذ migration أو DDL أو DML أو seed أو backfill أو population أو upload أو AI/provider/OCR call أو database write. لم يُطلب أو يُكشف أي secret، ولم تُعدّل Vercel configuration أو DNS.
