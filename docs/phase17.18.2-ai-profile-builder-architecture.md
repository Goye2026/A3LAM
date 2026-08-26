# Phase 17.18.2 — AI Profile Builder Architecture

## Decision closure

تنتقل A3LAM من contracts-only إلى **persistence-aware foundation** دون تفعيل AI inference. القرار الأساسي هو إضافة طبقة relational additive لجعل document ingestion وextraction وreview قابلة للتتبع، مع إبقاء provider وqueue وprivate storage وmalware scanning وretention غير مهيأة.

| المشكلة | البدائل | القرار |
|---|---|---|
| حفظ مستندات AI | bytes داخل DB، public media، private object storage abstraction | metadata وstorage key فقط داخل DB؛ private storage interface قابل للاستبدال، ولا استخدام لـpublic media |
| تنفيذ المعالجة | inline request، queue، provider call | queue abstraction؛ الحالة `REQUIRES_CONFIGURATION`، ولا job execution حقيقي |
| facts | JSON كبير داخل document واحد، fact/evidence منفصلان | `ai_extracted_facts` و`ai_fact_evidence` منفصلان مع provenance/checks |
| review history | overwrite current value، immutable decisions | current fact state + append-only `ai_review_decisions` |
| authorization | reuse generic system permission، frontend only، AI permissions | `ai.documents.read/create` و`ai.review` داخل RBAC الحالي مع server-side checks |
| migration | تعديل migrations سابقة أو destructive reset | migration additive `0008_phase17_18_2_ai_ingestion_review.sql`، created/not applied |

## Runtime boundaries

`POST /api/admin/ai/documents` لا يقبل upload في الحالة الحالية لأن private storage والqueue غير configured. عند تهيئة هذه الاعتمادات مستقبلًا، يمر الطلب عبر `submitAiDocument`: validate → private storage put → metadata/job transaction → queue enqueue. لا تُرسل bytes إلى provider ضمن هذا phase.

`GET /api/admin/ai/documents` و`GET /api/admin/ai/documents/[id]` يقدمان safe private metadata وextracted text/facts للمخولين فقط. `POST /api/admin/ai/documents/[id]/review` يبدأ human review، و`POST /api/admin/ai/facts/[factId]/review` يقبل/يعدل/يرفض fact مع audit history. لا توجد generation أو publication endpoints.

## Persistence model

الجداول الستة هي: `ai_documents`، `ai_processing_jobs`، `ai_extracted_sources`، `ai_extracted_facts`، `ai_fact_evidence`، و`ai_review_decisions`. جميعها لا ترتبط مباشرة بـ`people` أو `profiles`. الـdocument owner polymorphic (`ADMIN_IDENTITY` أو `USER`) ويستخدم checksum/index/idempotency لمنع duplicate submission دون merge أو overwrite تلقائي.

## Extraction

TXT هو extractor deterministic الوحيد المتاح حاليًا، ويعمل على in-memory bytes بعد validation. PDF وDOCX مدعومان كعقد validation فقط وتعود حالتهما `EXTRACTION_UNAVAILABLE` حتى يضاف extractor معتمد ومختبر. لا يوجد OCR أو PDF parser أو DOCX parser أو AI summarization ضمن هذا phase.

## Review and publication

كل fact يحتاج confidence وclassification وprovenance/evidence. القيم المقبولة ليست probability fake؛ confidence vocabulary هو `high/medium/low/unknown`. كل generated/future result يجب أن يبدأ `DRAFT`، ولا يمكن لهذا foundation أن ينشئ أو ينشر Person/Profile.

## Migration state

`0008_phase17_18_2_ai_ingestion_review.sql` أُضيف إلى registry فقط. لا migration runner ولا `DATABASE_URL` ولا production database operation استُخدمت. تبقى `0007_phase17_16_media_architecture.sql` pending كما كانت، ولا يُعتبر وجود ملف migration مساويًا لتطبيقه.
