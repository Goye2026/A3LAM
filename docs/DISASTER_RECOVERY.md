# A3LAM — Disaster Recovery

هذه الخطة مخصصة لاسترداد خدمة A3LAM بعد فقدان قاعدة البيانات أو الخادم أو تعرّض secret للاشتباه. وهي وثيقة تشغيلية فقط؛ لا تنفذ cutover أو credential rotation أو restore تلقائيًا.

## Objectives

يحدد مالك الخدمة أهداف RPO وRTO بحسب نشاط التحرير والموارد المتاحة، ويوثقها قبل الإطلاق. كحد أدنى، يجب أن تكون هناك نسخ يومية مشفرة، نسخة أسبوعية أطول احتفاظًا، ونسخة اختبار استعادة حديثة على قاعدة منفصلة.

## Incident procedure

1. أعلن الحادث وحدد قائد الاسترداد، ثم أوقف الكتابات وفق خطة التشغيل بدل تعطيل authorization أو تجاوز publication gates.
2. احفظ السجلات والـdeployment commit ووقت آخر نسخة ناجحة، ولا تحذف قاعدة الفشل قبل التحقيق.
3. حدد backup معتمدًا وتحقق من checksum ومصدره، ثم استعد إلى PostgreSQL منفصل.
4. نفّذ فحوص schema/migrations/read-only/public privacy/Admin boundary على البيئة المعزولة.
5. شغّل الإصدار المطابق للنسخة، افحص `/api/health` والسجلات، ثم احصل على موافقة cutover.
6. حوّل المرور عبر reverse proxy أو Vercel إلى الهدف المعتمد، وراقب الأخطاء والـlatency.
7. عند الاشتباه بتسرب secret، دوّر credential عبر secret manager فقط، ثم أعد التحقق من الجلسات والـsame-origin policy.
8. وثّق timeline، سبب الحادث، النسخة المستعادة، نتائج الاختبار، والإجراءات التصحيحية.

## Rollback

احتفظ بآخر release commit وبصورة Docker وبـbackup المرتبط بها. إذا فشل الإصدار، أعد آخر نسخة معروفة بدل تشغيل migrations عكسية غير موجودة. أي schema change أو Production DML خارج خطة معتمدة هو سبب للتوقف والتصعيد.

## Phase 17.8 boundary

لم تُنفذ استعادة مدمرة، ولم تتغير Production database أو secrets أو DNS ضمن هذه المرحلة. راجع `BACKUP.md` و`RESTORE.md` للتفاصيل التنفيذية.
