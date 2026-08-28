# PHASE 17.19.12 — RECOVERY PLAN

## Current recovery gate

```text
PRODUCTION_RECOVERY_GATE = REQUIRES_AUTHORIZATION
PRODUCTION_RECOVERY = NOT_STARTED
```

هذه الوثيقة تصف المسار الآمن المستقبلي فقط. لم تُنفذ أي Production migration أو DDL أو DML.

## Preconditions

لا يبدأ Mode B إلا بعد إثبات كل العناصر التالية: تفويض صريح ومحدد لاستعادة Production schema، قناة PostgreSQL صالحة، هدف قاعدة محدد دون كشف credential، backup/snapshot قابل للاستعادة مع timestamp وidentifier وrestore path، manifest/order verified، isolated rehearsal ناجح، data compatibility PASS، وrollback/recovery plan مثبت. يجب أن يكون أي destructive constraint change معتمدًا صراحة، مع منع reset/drop/truncate/delete/seed/population.

الحالة الحالية:

| Gate | Required | Current |
|---|---|---|
| Production PostgreSQL channel | available | NOT_AVAILABLE |
| `BACKUP_STATUS` | CONFIRMED | NOT_CONFIRMED |
| `ISOLATED_REHEARSAL` | PASS | NOT_AVAILABLE |
| `MIGRATION_HISTORY` | read-only verified | NOT_OBSERVABLE |
| `MIGRATION_ORDER` | verified | SOURCE-VERIFIED ONLY |
| `DATA_COMPATIBILITY` | PASS | NOT_OBSERVABLE |
| `ROLLBACK_STATUS` | tested | PLAN_ONLY |
| explicit authorization | available | REQUIRES_AUTHORIZATION |

## Safe rehearsal procedure

1. أنشئ clone PostgreSQL منفصلًا وغير مشترك، ولا تستخدم Production كبيئة اختبار.
2. استخدم snapshot أو fixture مصرحًا به فقط؛ لا تستخدم بيانات Production دون تفويض.
3. افحص schema metadata و`schema_migrations` read-only، ثم قارنها بالمخطط والmanifest.
4. شغّل migrations بالترتيب الرسمي عبر native runner على clone فقط، وتوقف عند أول failure أو registry inconsistency.
5. تحقق من الجداول والأعمدة والأنواع والـPK/FK/index/check constraints، ثم افحص unique/nullability/status compatibility وorphan relations.
6. شغّل deterministic fixture موسومة `TEST_*` على البيئة المعزولة فقط إن كانت عملية الاختبار نفسها مصرحًا بها.
7. شغّل repository/public projection checks وintegration tests ضد clone، ثم اختبر homepage وPerson route وcategories وsearch وCMS read paths.
8. نفذ rollback rehearsal إلى snapshot/clone عند failure وسجل الدليل؛ لا تعتبر rollback tested دون evidence فعلي.

## Production execution — not authorized here

بعد نجاح كل gates وموافقة مستقلة، يُستخدم native ordered migration runner فقط. لا تستخدم `drizzle-kit push` أو manual SQL أو direct registry edits أو force/reset/skip flags. يطبق runner أول pending migration فقط وبالمعاملة والقفل الأصليين، ثم يتحقق من expected objects/history قبل الانتقال إلى التالية. عند أي failure أو unexpected drift: `STOP`، ولا تتجاوز migration.

## Scope of likely repair

`person_media` هو أول runtime lead، لكن لا يجوز تطبيق 0007 blind أو افتراض أن 0001–0006 مطبقة. يجب تحديد أول pending migration من Production registry أولًا؛ قد تكون chain أوسع من 0007. 0008–0010 تحتوي constraint replacements وFK dependencies، لذا تحتاج compatibility proof مستقلة. لا يوجد في هذه المرحلة تصريح لتطبيق أي منها.

## Post-recovery validation

بعد recovery مصرح به فقط، استخدم GET/HEAD للتحقق من `/`, `/api/health`, `/categories`, `/search`, `/person/ibn-khaldun`, `/robots.txt`, `/sitemap.xml`، وAdmin guards. يجب أن تكون Homepage قادرة على إظهار Person cards عندما توجد سجلات منشورة حقيقية، أو EMPTY فقط إذا ثبت أن catalog فارغ. لا تُستخدم fake cards أو local repository fallback. يجب أن يبقى Person route published-only ولا يكشف internal IDs أو storage keys أو private fields.

CMS acceptance يتطلب فصل `CMS_CODE`, `CMS_SCHEMA`, `CMS_PERSISTENCE`, `CMS_AUTH`, و`CMS_BROWSER`. نجاح build لا يثبت persistence. لا تُجرى authenticated browser actions دون session مصرح بها.

## Rollback and recovery

`ROLLBACK_STATUS = PLAN_ONLY`. لا توجد rollback DDL عامة تلقائية موثوقة لهذه السلسلة. عند failure، أوقف التنفيذ، استعد من snapshot إلى clone أولًا، ثم اتخذ قرار provider-approved restore أو forward-fix بعد incident review. لا تحذف migration history ولا تنفذ reverse SQL ارتجاليًا.

## Prohibited operations

لا database reset، ولا drop schema/database/table، ولا truncate/delete production rows، ولا seed/population/backfill، ولا إنشاء Person/Profile/User، ولا AI/provider/OCR/upload، ولا تغيير secrets/DNS/Vercel configuration.

> DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION
