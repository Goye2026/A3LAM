# PHASE 17.19.10 — SAFE REPAIR PLAN

## Decision

الخطة الموصى بها هي **Option A — تطبيق migration chain native بعد rehearsal معزول**، وليس targeted migration مباشر أو تعديل Production runtime غير موثق. هذه توصية مستقبلية فقط؛ لا تُنفذ في Phase 17.19.10.

## Why this option

مصدر المشروع يفرض ترتيبًا صارمًا عبر `MIGRATION_VERSIONS` و`runNextMigration()`. `0007` هو أول missing relation evidence، لكن لا يمكن القفز إليه أو افتراض أن 0001–0006 مطبقة. كما أن 0008–0010 تحتوي على permission-constraint replacement وFK dependencies. لذلك يجب أولًا قراءة migration history/schema ثم تطبيق أول pending migration فقط عبر runner المعتمد، مع التوقف عند أي inconsistency.

## Preconditions

قبل أي Production execution يجب الحصول على تفويض صريح مستقل لهذه العملية، وتوفير قناة آمنة لا تكشف `DATABASE_URL` ولا تطبعها. يجب التحقق من snapshot/backup قابل للاستعادة، وتحديد نافذة تشغيل، وتأكيد أن Production traffic والـconnection pool مناسب، وقراءة `schema_migrations` و`information_schema`/`pg_catalog` بحساب read-only أولًا. يجب تحديد applied/pending/unexpected migrations، والتحقق من وجود core/admin/RBAC prerequisites، وفحص البيانات الحالية لأي nullability/unique/FK/status conflicts.

## Required backup

يجب أخذ provider-native snapshot أو backup موثق مع retention وrestore test قبل أي DDL. يجب تسجيل snapshot identifier ووقت الإنشاء والبيئة، دون تخزين secrets في repository أو logs. لا تكفي نسخة ملفات migrations كبديل عن database snapshot.

## Isolation procedure

1. إنشاء clone/staging/disposable PostgreSQL منفصل من snapshot أو dataset مصرح به، وعدم استخدام Production كـtest database.
2. تشغيل source migration files 0001–0010 على clone عبر native runner أو preview موثق، مع الحفاظ على transaction semantics.
3. مقارنة `information_schema` و`pg_catalog` و`schema_migrations` في clone مع expected model في `lib/db/schema.ts`.
4. تشغيل checks للـFK orphans، unique duplicates، nullability، check/status compatibility، and existing legacy image paths.
5. تشغيل application against clone في read-only/public test mode والتحقق من homepage و`/person/ibn-khaldun` وsearch وCMS guarded routes.
6. تسجيل أي mismatch جديد قبل طلب Production approval.

## Production execution plan — not executed here

بعد نجاح clone فقط، يقرأ runner أول pending manifest version ويطبقها transactionally مع advisory lock، ثم يسجل version في `schema_migrations`. يجب عدم تشغيل `drizzle-kit push` أو direct SQL bypass أو manual registry marking. بعد كل migration يجب إعادة preflight والتوقف إذا ظهرت inconsistent/unexpected state. لا يجوز تطبيق 0010 مباشرة إذا كانت prerequisites pending.

## Validation

بعد التنفيذ المصرح به، يجب التحقق read-only من وجود كل expected table/column/index/constraint/FK، وتطابق `schema_migrations` مع manifest، ثم اختبار runtime: `/`, `/api/health`, `/categories`, `/search`, `/person/ibn-khaldun`, `/sitemap.xml`, protected admin guards، وCMS read paths. يجب التأكد من publication gate وأن draft/review لا تظهر للعامة. `/api/health` وحده لا يثبت schema health.

## Rollback

لا توجد rollback تلقائية عامة آمنة لـDDL chain. المسار المعتمد هو restore من snapshot إلى isolated clone أولًا، ثم provider-approved restore/forward-fix بعد incident review. لا تحذف migration history ولا تنفذ `DROP` أو manual reverse SQL في Production. بالنسبة إلى 0008–0010، يجب اعتبار permission constraint replacement نقطة مخاطر تستوجب backup وdata compatibility proof.

## Alternatives

| Option | Assessment |
|---|---|
| A — native ordered migrations | **Recommended after isolation and approval**؛ يحافظ على manifest/runner ordering ويمنع skipping |
| B — targeted migration | غير موصى به الآن؛ قد يخفي pending prerequisites أو يترك registry inconsistent |
| C — compatibility patch | خيار طوارئ فقط إذا ثبت legacy schema بدليل، ويتطلب change review واختبارًا منفصلًا |
| D — runtime backward compatibility | يمكن دراسة منع optional media lookup من كسر الصفحة، لكنه لا يعالج schema drift أو CMS dependencies ولا يثبت صحة البيانات |

## Explicit approval gate

> DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION

لا تُنفذ أي migration أو DDL أو DML أو seed أو backfill أو schema sync أو Production repair ضمن هذه المرحلة. أي تنفيذ مستقبلي يجب أن يكون Phase مستقلة بحدود مكتوبة وموافقة صريحة.
