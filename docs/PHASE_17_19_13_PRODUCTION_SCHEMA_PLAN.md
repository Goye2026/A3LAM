# A3LAM — PHASE 17.19.13 PRODUCTION SCHEMA PLAN

## Status

`PRODUCTION_RECOVERY = BLOCKED`  
`PRODUCTION_SCHEMA_ACCESS = NOT_AVAILABLE`  
`BACKUP_STATUS = NOT_CONFIRMED`  
`ISOLATED_REHEARSAL = NOT_AVAILABLE`  
`EXPLICIT_AUTHORIZATION = NOT_VERIFIED`

## Purpose

هذه الخطة تحدد كيفية الانتقال الآمن من source/migration evidence إلى Production schema recovery إذا أصبحت الشروط متاحة. لا تحتوي على تنفيذ DDL أو DML ولا تمنح authorization.

## Phase A — read-only comparison

بعد توفير قناة PostgreSQL شرعية، اجمع فقط `current_database()`, `current_schema()`, `server_version` وmetadata من `information_schema`, `pg_catalog`, و`schema_migrations`. قارن table/column/index/constraint/FK/type/history state مع manifest وDrizzle schema. لا تُصدّر rows أو secrets أو credentials.

صنّف كل فرق إلى `SAFE_TO_CREATE`, `COMPATIBILITY_SENSITIVE`, `DESTRUCTIVE`, أو `UNKNOWN`. لا يُعالج `UNKNOWN` تلقائيًا.

## Phase B — isolated rehearsal

استخدم PostgreSQL clone منفصلًا وغير مشترك، وطبّق migrations `0001`–`0010` بالترتيب الرسمي عبر native runner. تحقق من كل migration والـobjects والـconstraints والـindexes والـrepository/public projections. استخدم `TEST_*` fixtures فقط داخل البيئة المعزولة، ولا تستخدم Production data إلا إذا كان هناك sanitized snapshot مفوض رسميًا.

## Phase C — authorization and backup

قبل Production DDL، يجب أن توجد موافقة صريحة وحالية لتنفيذ schema recovery، وbackup provider-native قابل للاستعادة مع identifier/timestamp/location/restore path، وrollback method مثبتة، وcompatibility checks ناجحة، وmigration order verified، وعدم وجود destructive operation غير معتمدة.

## Phase D — controlled recovery

إذا اجتازت كل gates، استخدم migration runner الأصلي فقط. طبّق أول pending migration canonical، تحقق بعده، ثم انتقل إلى التالية. عند failure أو state inconsistency، توقف فورًا ولا تتجاوز migration ولا تعدل history يدويًا.

ممنوع استخدام `drizzle-kit push`, manual SQL، reset، drop، truncate، delete، seed، population، backfill، إنشاء Person/Profile/User، upload، AI/provider/OCR، أو تغييرات secrets/DNS/Vercel.

## Phase E — functional validation

بعد schema verification، افحص GET/HEAD للمسارات العامة وprotected guards، ثم اختبر Homepage وPerson route وCategories وSearch وCMS فقط ببيانات منشورة حقيقية أو EMPTY مثبتة. يجب فصل `CODE_READY`, `DATABASE_READY`, `AUTH_READY`, `PERSISTENCE_READY`, و`BROWSER_VERIFIED`.

## Current conclusion

لا يمكن الانتقال إلى Phase D. الخطوة الآمنة التالية هي توفير backup/isolated rehearsal/metadata channel/authorization، ثم إعادة تقييم gates. حتى ذلك الحين تبقى الصفحة degraded، ولا يجوز إعلان `Homepage fixed` أو `Production recovered` أو `Database healthy`.
