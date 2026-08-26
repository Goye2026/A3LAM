# Phase 17.18.2 — AI Ingestion & Review Security

**الحالة:** Foundation فقط؛ لا inference ولا provider ولا upload Production ولا migration execution.

## 1. حدود البيانات

المستندات والنصوص المستخرجة وstructured facts وevidence وreview decisions بيانات خاصة افتراضيًا. لا توجد علاقة مباشرة بين AI tables و`people` أو `profiles`، ولا توجد أي آلية تنشئ Person أو Profile أو تنشرهما تلقائيًا. كما لا تُضاف أي إشارة إلى AI documents أو extracted text إلى public routes أو search أو sitemap أو Open Graph أو JSON-LD.

تخزن قاعدة البيانات metadata وstorage reference فقط. لا تُخزن bytes داخل PostgreSQL. وعند اكتمال private storage مستقبلًا يجب أن يبقى object key server-only، وألا يُحوّل إلى public URL أو signed URL عام. الـpublic media storage الحالي ليس مصدرًا لمستندات AI.

## 2. Authorization

أُضيفت permissions typed إلى نظام RBAC الحالي فقط: `ai.documents.read` و`ai.documents.create` و`ai.review`. يحصل `ADMIN` على القراءة/الإنشاء/المراجعة، ويحصل `EDITOR` على القراءة/المراجعة دون الإنشاء، ولا يحصل `MODERATOR` على AI scope. تعتمد page وAPI على server-side `requirePermissionPrincipal`؛ إخفاء الرابط في الواجهة ليس حدًا أمنيًا.

كل private read يقيّد البيانات على `ownerType` و`ownerId` أو Admin scope صريح. لا تسمح repositories بقراءة user-owned documents من خلال Admin endpoint بطريقة غير مقصودة، ولا تعيد storage key من safe document projection. مسارات الكتابة تستخدم same-origin/CSRF guard وتتحقق من body server-side.

## 3. Document validation

تقبل validation عقود PDF/DOCX/TXT فقط، وتتحقق من extension وMIME والحجم الأقصى 10MB والاسم الآمن والـmagic bytes. ترفض الملفات الفارغة وHTML/Script المتنكر وNUL والملفات malformed أو ZIP متنكرًا كمستند DOCX. النص المستخرج يخضع إلى Unicode normalization وحد أقصى 8MB وإزالة control characters غير الدلالية.

يجري حساب SHA-256 للمستند. التكرار لا يؤدي إلى overwrite أو merge تلقائي؛ يُعاد existing metadata عند تطابق checksum ضمن نفس owner، وتبقى هوية الكيان منفصلة عن تشابه الاسم.

## 4. Provider, queue, storage and malware boundaries

حالة AI provider الحالية `REQUIRES_CONFIGURATION`، ولا تُنفذ network calls. queue الحالية `REQUIRES_CONFIGURATION`، وprivate document storage الحالية `REQUIRES_CONFIGURATION`، وmalware scanning وretention policy غير مهيأين. لذلك يمنع POST upload الإنتاجي قبل توفر هذه الاعتمادات، ولا توجد مفاتيح أو endpoints أو model names في client code.

Orchestration يستخدم dependency injection لـstorage وqueue حتى يمكن اختبار العقد لاحقًا دون ربط provider أو public bucket. لا يوجد progress أو success اصطناعي؛ progress/retry في uploader contract لا يظهر إلا إذا زوّدته عملية حقيقية بقيمة وحالة حقيقية.

## 5. Lifecycle, retry and deletion

يمر المستند بالحالات typed التالية: `UPLOADED` و`VALIDATING` و`EXTRACTING` و`EXTRACTED` و`NORMALIZING` و`READY_FOR_REVIEW` و`REVIEW_IN_PROGRESS` و`APPROVED` و`READY_FOR_GENERATION` مع حالات failure/terminal صريحة. job state منفصل ومحدود بثلاث محاولات، مع idempotency key مبني على owner/checksum.

لا ينفذ هذا phase deletion فعليًا. migration تحتفظ بعلاقات cascade داخل AI-only children، ولا يوجد cascade إلى Person/Profile. قبل تفعيل storage production يجب تحديد retention duration وhard-delete/crypto-delete وlegal hold وowner request وbackup expiry، ثم تسجيل كل عملية حذف أو archive في audit log.

## 6. Review and publication gate

لا تُعتبر fact قابلة للمراجعة دون evidence bounded، وتشمل كل fact confidence وclassification وprovenance. قرار المراجع يكتب immutable history في `ai_review_decisions` ويحفظ original/reviewed value. `ACCEPTED` و`EDITED` يرفعان classification إلى `EDITOR_VERIFIED`، و`REJECTED` لا ينشئ أي profile.

أي future generation must enter as `DRAFT`. لا توجد في Phase 17.18.2 endpoints للـgeneration أو publication أو profile mutation، ولا يملك review endpoint مسارًا لتجاوز editorial publication gate.

## 7. Audit and error handling

تُعاد استخدام `audit_logs` الحالي عبر typed AI audit vocabulary. تسجل transitions والفاعل والكيان والقرار، ولا تسجل raw CV text أو full extracted value أو token أو credential أو private storage URL. API error mapper يعيد safe public envelopes ولا يعرض stack traces أو raw database messages.

## 8. Migration boundary

تم إنشاء `0008_phase17_18_2_ai_ingestion_review.sql` وإضافته إلى manifest كـ`CREATED / NOT APPLIED`. migration additive وتحتوي جداول AI الستة وchecks/indexes، ولا تنشئ People/Profile أو seed أو user accounts. لم يُشغّل migration runner، ولم تُقرأ أو تُطلب `DATABASE_URL`، ولم يحدث أي Production DDL/DML.

## 9. Remaining security prerequisites

قبل أي activation إنتاجي يجب إضافة private object storage حقيقي، malware scanning، queue worker، retention/deletion implementation، rate limiting/upload quotas، content-type verification at storage edge، observability without sensitive payloads، and dedicated integration tests against an isolated database. هذه البنود ليست جزءًا من التنفيذ الحالي.
