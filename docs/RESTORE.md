# A3LAM — Restore Verification Runbook

لا تختبر الاستعادة فوق قاعدة Production الحية. يجب توفير قاعدة PostgreSQL منفصلة، معزولة، وبنفس إصدار الخادم أو إصدار متوافق. هذا الملف يصف الإجراء ولا ينفذه.

## Restore to an isolated database

```bash
export RESTORE_DATABASE_URL='postgresql://provided-by-secret-manager'
pg_restore --exit-on-error --no-owner \
  --dbname="$RESTORE_DATABASE_URL" \
  /secure/backups/a3lam-YYYYMMDDTHHMMSSZ.dump
```

يجب أن تأتي قيمة `RESTORE_DATABASE_URL` من secret manager أو جلسة تشغيل محمية، ولا يجوز طباعتها. لا تستخدم production URL للاختبار.

## Verification checklist

بعد الاستعادة، نفّذ فحوصًا read-only فقط: راجع `schema_migrations`، تطابق migration files، وجود الجداول المتوقعة، publication filtering، عدم تسرب بيانات private contact، حماية Admin routes، و`/api/health` عند تشغيل التطبيق على النسخة المعزولة. قارن عدد السجلات والـchecksums من دون تعديل البيانات.

## Cutover and cleanup

لا يتم cutover إلا بعد موافقة تشغيلية صريحة وخطة rollback. احتفظ بقاعدة الفشل للتحقيق عند الحاجة، واحذف قاعدة التحقق المنفصلة فقط بعد تسجيل الدليل والموافقة. لا تنفذ `DROP`, `TRUNCATE`, أو restore فوق Production كجزء من هذا الدليل.

للاستعادة أثناء حادث، اتبع `DISASTER_RECOVERY.md` وسجل نقطة الاستعادة، الإصدار، نتائج التحقق، والقرار النهائي.
