# A3LAM — Backup Runbook

النسخ الاحتياطي مسؤولية مالك الاستضافة. يجب أن تكون النسخ مشفرة، خارج خادم التطبيق، ومقيدة على مشغلي قاعدة البيانات. لا تحفظ dump في Git أو Docker image أو web root أو public storage.

## Scope

هذا الدليل لا ينفذ backup ولا يقرأ `DATABASE_URL`. الأوامر التالية أمثلة تشغيلية؛ يحق للمشغّل تنفيذها فقط من بيئة secret-managed مناسبة.

## PostgreSQL custom-format backup

```bash
umask 077
backup="/secure/backups/a3lam-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --file="$backup" "$DATABASE_URL"
sha256sum "$backup" > "$backup.sha256"
```

يفضل استخدام نسخة PostgreSQL client متوافقة مع الخادم. خزّن النسخ في موقع منفصل أو object storage مشفر، واحتفظ مثلًا بسبع نسخ يومية وأربع نسخ أسبوعية أو بسياسة مؤسسية أشد، مع مراقبة نجاح المهمة والمساحة.

## Pre-migration backup

قبل أي migration معتمد على قاعدة جديدة أو تغيير مصرح به، خذ backup ناجحًا، تحقق من checksum، وسجل release commit ووقت النسخة. Phase 17.8 لا يطبق migrations على Production؛ registry الحالي هو 6 applied و0 pending و6 expected.

## Scheduled operation

شغّل النسخ عبر scheduler خارج التطبيق، مع locking لمنع تداخل مهمتين، تنبيه عند الفشل، واختبار استعادة دوري على قاعدة منفصلة. لا تضف cron أو credentials إلى المستودع.

## Evidence

احتفظ بسجل غير حساس يتضمن وقت النسخ، الحجم، checksum، النتيجة، وموقع التخزين. لا تسجل connection string أو token أو كلمة مرور. راجع `RESTORE.md` و`DISASTER_RECOVERY.md` لاختبار الاستعادة وخطة الحوادث.
