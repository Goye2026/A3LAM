# A3LAM — Production Runbook

هذا runbook مخصص للتشغيل اليومي والتحقق الآمن عبر **GET/HEAD-only**. لا تستخدمه لإنشاء بيانات، تنفيذ migrations، تغيير secrets، أو اختبار mutations على Production.

## Read-only release smoke

```bash
base='https://a3-lam.vercel.app'
curl -fsS "$base/"
curl -fsS "$base/api/health"
curl -fsS "$base/categories"
curl -fsS "$base/search"
curl -fsS "$base/register"
curl -fsS "$base/login"
curl -fsS "$base/robots.txt"
curl -fsS "$base/sitemap.xml"
```

تحقق من HTTP 200، content types، canonical HTTPS، وعدم ظهور `DATABASE_URL`, access tokens, session cookies, password hashes, Admin metadata, أو migration-control markers في public HTML. Admin pages بدون session يجب أن تعيد redirect/login، وAdmin APIs بدون session يجب أن تعيد `401` ضمن method المسموح. لا ترسل `POST`, `PUT`, `PATCH`, أو `DELETE` في هذا smoke.

## Health interpretation

`/api/health` هو application liveness probe آمن ويعيد حالة التطبيق ووقت الفحص؛ لا يثبت وحده جاهزية PostgreSQL أو storage أو email. راجع `/admin/system` عبر جلسة مخولة للقراءة، ثم راقب database/provider state دون تشغيل أي action.

## Logs and incidents

ابدأ بوقت الحادث، deployment commit، route، status code، وruntime logs. لا تنسخ secrets أو cookies أو request bodies الحساسة إلى issue. صنّف المشكلة إلى application، database، provider، domain/TLS، أو infrastructure. عند الاشتباه في فقد بيانات، انتقل إلى `DISASTER_RECOVERY.md` ولا تنفذ repair SQL يدويًا.

## Database and migrations

لا تشغل `pnpm db:migrate` على قاعدة قائمة لمجرد الفحص. لا تشغل `pnpm db:seed` في Production. على قاعدة جديدة فقط، خذ backup ثم استخدم migration runner المعتمد وفق خطة مستقلة؛ registry الحالي لـA3LAM هو 6 applied و0 pending و6 expected.

## Rollback

احتفظ بالإصدار السابق وصورة Docker وbackup. عند فشل release، أعد deployment أو process إلى آخر release معروف، افحص health والـpublic routes، ثم افتح incident. لا تستخدم reset/rebase/force push، ولا تنفذ destructive restore أو schema change كحل سريع.

## Provider state

Storage/email/monitoring قد تظهر `REQUIRES CONFIGURATION`. لا تستبدل هذه الحالة ببيانات وهمية أو provider credentials. سجّل قرار التكوين في secret manager وخطة تغيير منفصلة، ثم أعد read-only smoke.
