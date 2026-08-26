# Phase 17.18.2 — AI Ingestion Data Model

**الحالة:** تصميم additive؛ migration ستُنشأ ولا تُطبّق في Production.
**القاعدة:** لا يُنشئ AI Person أو Profile تلقائيًا، ولا تدخل البيانات غير المنشورة إلى public projection.

## 1. Model overview

تم اختيار ستة كيانات مترابطة لأن كل مفهوم له lifecycle وaccess semantics مختلفة. `ai_documents` يمثل الأصل الخاص وmetadata فقط، `ai_processing_jobs` يمثل محاولة معالجة idempotent، `ai_extracted_sources` يمثل النص المنظم الناتج من extraction، `ai_extracted_facts` يمثل fact قابلًا للمراجعة، `ai_fact_evidence` يمثل provenance/location، و`ai_review_decisions` يمثل قرار reviewer مع original/reviewed values.

```text
AI Document 1 ──< Processing Jobs
     │
     └──── 1 ──< Extracted Sources 1 ──< Extracted Facts 1 ──< Fact Evidence
                                      │
                                      └──────────────< Review Decisions >── Admin Identity
```

لا يرتبط النموذج مباشرة بـ`people` أو `profiles` في هذه المرحلة. الربط المستقبلي يجب أن يكون خطوة صريحة بعد اكتمال human review، ولا يجوز أن يحذف document المنشور Person أو Profile.

## 2. Entities

| Entity | Purpose | Sensitive fields | Delete policy |
|---|---|---|---|
| `ai_documents` | private document metadata and storage reference | storage key, owner reference, checksum, failure detail | future controlled deletion; no cascade to Person/Profile |
| `ai_processing_jobs` | bounded processing attempts and lifecycle | error detail, queue key | cascade from document; retry is bounded |
| `ai_extracted_sources` | normalized extracted text with extractor metadata | normalized text | cascade from document; never public |
| `ai_extracted_facts` | structured fact candidate | value JSON, classification, confidence | cascade from source |
| `ai_fact_evidence` | source location and bounded excerpt | excerpt and source URL | cascade from fact |
| `ai_review_decisions` | immutable review decision history | original/reviewed values and note | cascade from fact; reviewer FK set null if identity removed |

## 3. Lifecycle vocabularies

Document ingestion uses a centralized typed vocabulary:

`UPLOADED → VALIDATING → EXTRACTING → EXTRACTED → NORMALIZING → READY_FOR_REVIEW → REVIEW_IN_PROGRESS → APPROVED → READY_FOR_GENERATION`.

Failure and terminal states are explicit: `REJECTED`, `EXTRACTION_FAILED`, `PROCESSING_FAILED`, `REVIEW_REJECTED`, and `ARCHIVED`. Job states are `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, and `CANCELLED`. Extraction states are `NOT_STARTED`, `IN_PROGRESS`, `SUCCEEDED`, `FAILED`, and `UNAVAILABLE`. Review decisions are `UNREVIEWED`, `ACCEPTED`, `EDITED`, and `REJECTED`.

## 4. Ownership and access

Each document has an `ownerType` and `ownerId`; the initial administrative path uses `ADMIN_IDENTITY` and the uploader identity. Repository reads must filter by owner context unless the actor has an explicit administrative permission. Storage keys and raw text are server-only. API list/detail responses must return safe metadata projections and never return storage credentials, signed URLs, raw text, evidence excerpts, or full JSON values unless a separately authorized private review read is implemented.

## 5. Idempotency and retry

`checksumSha256` is indexed per owner and used to detect a same-content submission. Duplicate detection is non-destructive: an existing document is reused or reported as duplicate; the prior document is not deleted. A processing job carries an idempotency key and attempt number. Retry is bounded by a constant, and no queue provider is called while `QUEUE_PROVIDER = REQUIRES_CONFIGURATION`.

## 6. Provenance and privacy

Every fact requires at least one evidence row before it can be considered reviewable. Evidence stores a bounded excerpt, page/section when available, and a validated HTTP(S) source URL when applicable. Confidence remains typed (`high`, `medium`, `low`, `unknown`) and classification remains the Phase 17.18.1 vocabulary. Raw documents, extracted text, facts, evidence, review notes, storage URLs, and private metadata are excluded from public APIs, sitemap, JSON-LD, Open Graph, search, and person pages.

## 7. Audit reuse

Sensitive operations reuse the existing `audit_logs` table. Audit payloads contain actor/action/entity identifiers and safe status transitions only; they do not contain raw CV text, full document values, tokens, credentials, or private URLs. New AI audit action names remain in the typed contract and are mapped to existing generic columns.

## 8. Migration decision

Migration `0008_phase17_18_2_ai_ingestion_review.sql` is additive and creates only the six AI tables plus bounded indexes and checks. It must be added to the repository manifest as `CREATED / NOT APPLIED`. The known `0007_phase17_16_media_architecture.sql` pending state remains untouched, and no migration runner or Production database operation is executed in this phase.
