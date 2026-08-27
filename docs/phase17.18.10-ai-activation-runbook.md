# A3LAM — Phase 17.18.10
## Future AI Activation Runbook

> **حالة هذا الملف:** إجراءات مستقبلية فقط بعد تفويض مستقل. لم تُنفذ أي خطوة من الخطوات التالية في Phase 17.18.10.

## Preconditions

لا يبدأ هذا runbook إلا بعد تفويض مكتوب منفصل يحدد البيئة غير الإنتاجية أولًا، والمالك المسؤول، ونطاق pilot، ومدة القياس، وشروط الإيقاف. يجب أن تبقى feature gates و`AI_PUBLICATION_ENABLED` مغلقة حتى اكتمال كل sign-off.

## 1. Dependency provisioning

أنشئ provider، private object storage، malware scanner، queue، worker، OCR، observability، وrate/cost-control dependencies في بيئة sandbox مستقلة. يجب ألا تستخدم Production credentials أو Production data، ويجب تسجيل ownership وregion وretention وnetwork policy دون كشف secrets.

## 2. Isolated migration rehearsal

أثبت هوية قاعدة بيانات non-Production مستقلة، ثم نفّذ migration rehearsal على نسخة اختبارية قابلة للإتلاف. تحقق من manifest order، foreign keys، unique/check constraints، cascade/detach semantics، repeat behavior، وrollback decision. لا تُستخدم `DATABASE_URL` الخاصة بـProduction.

## 3. Migration application

بعد مراجعة rehearsal واعتمادها، طبّق migrations من runner الرسمي في البيئة المصرح بها فقط، وسجّل applied versions وschema verification. لا تُشغّل migration داخل build. أي تطبيق Production يحتاج تفويضًا مستقلًا وخطة backup/restore ونافذة تغيير ومراقبة.

## 4. Provider configuration

سجّل endpoint/model/timeout/retry/max input/max output وapproved data-processing terms. خزّن token في secret manager فقط، وامنع ظهوره في logs/client payloads. نفّذ provider health and safety tests في sandbox أولًا، ثم راجع `allowedForProduction` independently.

## 5. Storage configuration

أنشئ private-only bucket أو adapter مع owner-scoped keys، traversal rejection، encryption/access policy، signed retrieval expiry، metadata redaction، detach/delete، orphan cleanup، وretention. أثبت أن public URLs وindexing غير متاحين افتراضيًا.

## 6. Malware scanner

هيّئ scanner fail-closed مع حالات SAFE/INFECTED/ERROR/UNAVAILABLE وtimeout. يجب ألا يبدأ processing عند أي حالة غير SAFE، ويجب حفظ safe operational event دون raw document أو signature secrets.

## 7. Queue worker

هيّئ durable queue وworker lease/heartbeat، idempotency key، bounded retries، exponential backoff، stale-job recovery، cancellation، dead-letter handling، وconcurrency ceiling. أثبت عدم duplicate execution تحت redelivery.

## 8. OCR

إذا تقرر دعم scanned PDFs، هيّئ OCR منفصلًا مع page/language/input/timeout/retry/cost limits. لا يتحول `OCR_REQUIRED` إلى extracted content تلقائيًا، ولا يُسمح ببدء OCR دون gate وprivacy review.

## 9. Observability

اربط privacy-safe structured signals: job ID، status، duration، provider state، error category، retry count، correlation ID، وactor ID حيث يسمح policy. امنع raw CV، extracted text، prompts، full provider response، credentials، tokens، وstorage keys من logs/traces.

## 10. Rate and cost controls

فعّل distributed per-user/per-role upload and generation limits، per-document/job budgets، output/input caps، retry ceiling، provider timeout، circuit breaker، budget alerts، وanomaly monitoring. يجب اختبار enforcement تحت concurrency وmulti-instance execution.

## 11. Controlled pilot

ابدأ pilot محدودًا في بيئة معتمدة وببيانات synthetic أو data مفوضة صراحةً، مع reviewers حقيقيين، feature gates منفصلة، allowlist للعمليات، ووقف فوري عند secret leakage أو privacy exposure أو publication bypass أو cost anomaly أو duplicate side effect. لا ينشئ pilot Person/Profile أو Published content تلقائيًا.

## 12. Rollback

أوقف upload/processing/generation gates أولًا، ثم أوقف worker والqueue consumption، واحفظ safe operational evidence، واعزل provider/storage credentials، ونفّذ application rollback عبر normal deployment mechanism. لا تستخدم destructive database rollback بلا خطة معتمدة؛ تعامل مع records عبر archive/detach/restore policy.

## 13. Post-activation verification

بعد pilot أو activation مصرح به، تحقق من health والـreadiness وsampled latency/error/retry/cost، وowner isolation، deletion/retention، audit completeness، RBAC، public route privacy، sitemap/search/OG/JSON-LD isolation، وDRAFT-only boundary. احصل على editorial/security sign-off قبل أي publication lifecycle.

## Required sign-offs

| المجال | المالك المقترح | الدليل المطلوب |
|---|---|---|
| Provider/data processing | AI Platform + Security | approved config and sandbox report |
| Storage/privacy | Platform + Privacy | private access/deletion rehearsal |
| Scanner/queue/worker | Security + SRE | fail-closed and retry/stale evidence |
| OCR | AI Platform + Privacy | bounded OCR acceptance |
| Migrations | Database owner | isolated rehearsal and registry proof |
| Cost/rate | Platform + Finance | budget/circuit-breaker evidence |
| Editorial review | Editorial owner | reviewer workflow and publication approval |
| Rollback | SRE/Platform | rehearsed stop and recovery record |

## Hard stop conditions

توقف ولا تتابع إذا ظهر أي publication bypass، أو secret/private-content leakage، أو قدرة AI على إنشاء Person/Profile أو تغيير permissions، أو provider/tool access غير مصرح، أو duplicate uncontrolled job، أو data-loss risk، أو migration inconsistency، أو تجاوز budget/rate limits.

## Explicit boundary

هذا runbook لا يفعّل أي dependency ولا يطبق migration ولا يغيّر secrets أو Vercel/DNS configuration. أي تنفيذ يحتاج task منفصلًا، scope واضحًا، موافقة صريحة، وقرارًا جديدًا بعد مراجعة evidence.
