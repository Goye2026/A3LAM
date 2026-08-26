# A3LAM AI Profile Builder — Production Activation Runbook

## الغرض

هذا المستند يصف المتطلبات المستقبلية لتفعيل AI Profile Builder في Production. لا ينفذ أي خطوة من خطوات التفعيل، ولا يطبّق migrations، ولا يغيّر Vercel environment، ولا ينشئ provider أو storage أو queue.

> **قاعدة الإطلاق:** نجاح isolated mock tests لا يساوي جاهزية Production. لا يُزال kill switch إلا بعد إكمال كل بوابات هذا runbook ومراجعتها بشريًا.

## بوابات ما قبل التفعيل

| المجال | المتطلب | دليل الإغلاق المطلوب |
|---|---|---|
| Private storage | مزود object storage خاص، encryption، owner-scoped keys، منع public listing، lifecycle policy | اختبار وصول owner/admin/cross-owner وstorage audit |
| Malware scanning | scanner server-side قبل extraction، bounded timeout، quarantine path | نتائج clean/infected/timeout مع عدم إنشاء job عند الفشل |
| Queue worker | queue durable مع idempotency وbounded retry وdead-letter state | اختبار enqueue/duplicate/retry/exhaustion |
| Retention/deletion | سياسة احتفاظ، حذف raw documents وderived text وclaims وفق policy، audit deletion | deletion report قابل للتدقيق |
| AI provider | provider معتمد، server-side secret، structured output، timeout، rate limit، cost ceiling | provider contract test دون بيانات production أولًا |
| OCR | OCR provider أو worker منفصل، privacy review، language support، cost control | اختبار OCR_REQUIRED ثم successful isolated OCR |
| Migrations | تطبيق 0007 و0008 و0009 عبر آلية migration المعتمدة في بيئة معزولة أولًا | registry evidence وschema verification |
| Integration environment | قاعدة بيانات وstorage وqueue معزولة تمامًا عن Production | proof of separate credentials/endpoints |
| Monitoring | structured events آمنة، latency/error dashboards، alerts، no raw content | dashboard and alert evidence |
| Rate limits | per-admin/per-owner limits، upload/body limits، abuse controls | automated limit tests |
| Cost controls | budget، per-job token limits، provider fallback policy، kill switch | approved cost model and alert thresholds |
| Privacy/retention policy | notice، consent/legal basis عند الحاجة، access/deletion handling، DPIA/security review | policy approval and test evidence |

## Activation sequence

1. أنشئ isolated integration environment منفصلًا عن Production.
2. طبّق migrations additive-only في البيئة المعزولة بعد مراجعة SQL.
3. هيّئ private storage والـscanner والـqueue والـretention، ثم اختبر cross-owner isolation.
4. هيّئ provider server-side في البيئة المعزولة دون إرسال بيانات حقيقية.
5. شغّل fixtures الاصطناعية من Phase 17.18.5 واحتفظ بسجل evidence.
6. نفّذ security/privacy review، مع التحقق من عدم ظهور raw text أو prompts أو claims على public surfaces.
7. نفّذ canary محدودًا بموافقة تحريرية واضحة، مع إبقاء output في DRAFT وعدم إنشاء Person/Profile تلقائيًا.
8. راقب failure states والتكاليف والاحتفاظ والحذف.
9. لا تغيّر `AI_PRODUCTION_ENABLED` إلى enabled إلا بقرار مستقل موثق، ومراجعة ثنائية، وخطة rollback.
10. بعد كل تغيير نفّذ read-only public smoke وراجع audit log.

## قواعد البيانات والـmigrations

لا تُطبّق migrations 0007–0009 على Production ضمن هذا runbook. عند فتح مهمة مستقلة، يجب استخدام runner المعتمد، والتحقق من `schema_migrations` server-side، وعدم طباعة `DATABASE_URL` أو أي secret، وعدم إنشاء seed أو test users.

## حدود النشر

تبقى publication boundary كما يلي: **AI output ≠ Person، وAI output ≠ Profile، وAI output ≠ Published Content**. أي انتقال لاحق يتطلب human-controlled explicit action ومسار editorial review منفصلًا.

## معايير الإيقاف

أوقف العملية فورًا إذا ظهر provider غير مهيأ، storage عام، cross-owner access، raw content في logs، migration غير مسجل، retry غير محدود، غياب retention، خطأ غير قابل للتفسير، أو أي طلب لتجاوز authentication/RBAC/same-origin.

سجّل الحالة `BLOCKED` أو `REQUIRES_CONFIGURATION` بدل استخدام workaround أو fake success.
