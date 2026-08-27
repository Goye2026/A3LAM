# PHASE 17.18.12 — WORKFLOW INTEGRITY AUDIT

**التاريخ:** 27 أغسطس 2026
**Decision:** `PASS WITH LIMITATIONS`
**Implementation:** `cfe7c3838bc5ef4c27e561d310fca89c3b9f6993`

## Audit Scope

هذا audit يراجع integrity للـAI Editorial Workflow في sandbox/local-only ويقارنها بحدود Production الحالية. لم تُستخدم قاعدة Production أو secrets أو external provider، ولم تُنفذ أي migration أو mutation.

## State Machine Audit

### Canonical states

```text
EMPTY
  ↓
DOCUMENT_READY
  ↓
EXTRACTED
  ↓
FACTS_READY
  ↓
FACT_REVIEW_REQUIRED
  ↓
FACTS_ACCEPTED
  ↓
GENERATION_READY
  ↓
GENERATING
  ↓
DRAFT_READY
  ↓
CLAIM_REVIEW_REQUIRED
  ↓
DRAFT_REVIEWED
  ↓
EDITORIAL_DRAFT_READY
```

`EDITORIAL_DRAFT_READY` terminal داخل هذه المرحلة. لا يوجد edge إلى `PUBLISHED` أو `PERSON_CREATED` أو `PROFILE_CREATED`.

### Transition audit

| transition/condition | expected | evidence |
|---|---|---|
| EMPTY → GENERATING | blocked | `INVALID_TRANSITION` test |
| anonymous/permission missing | blocked | `PERMISSION_DENIED` test |
| expectedRevision mismatch | blocked | `STALE_REVISION` test |
| invalid document | blocked | `WORKSPACE_NOT_FOUND` guard |
| extraction not succeeded | blocked | extraction status guard |
| facts missing | blocked | `SOURCE_REQUIRED` guard |
| REQUEST_SOURCE fact | blocked | `SOURCE_REQUIRED` test |
| critical fact not reviewed | blocked | `REVIEW_REQUIRED` guard |
| missing evidence/provenance | blocked | `SOURCE_REQUIRED` guard |
| unresolved conflict | blocked | `CONFLICT_UNRESOLVED` test |
| missing generation job | blocked | `GENERATION_NOT_READY` guard |
| invalid output | blocked | `OUTPUT_INVALID` test |
| no claim at DRAFT_READY | blocked | claims guard |
| unreviewed claim | blocked | `CLAIM_REVIEW_REQUIRED` guard |
| quality gate not passed | blocked | `QUALITY_GATE_FAILED` guard |
| publication state requested | no allowed edge | terminal graph test |

## Draft Integrity Audit

`WorkflowDraftIntegrity` requires:

- generationJobId
- generationAttemptId
- sourceDocumentId
- sourceLanguage
- outputLanguage
- generationMode
- createdAt
- provenance
- claims
- unresolvedConflicts
- reviewState
- revision

الاختبار يثبت أن claim يحتفظ بـsourceFactIds وevidenceIds وprovenance مع documentId. لا يمكن اعتبار draft منفصلًا عن المصدر في contract.

## Fact Integrity Audit

لا يتم overwrite للقيمة الأصلية. يحتفظ كل `WorkflowFact` بـ`originalValue`، وتُضاف `reviewedValue` عند المراجعة، مع reviewerId وreviewedAt وoptional reviewerNote. الأفعال supported هي ACCEPTED وEDITED وREJECTED وREQUEST_SOURCE.

`REQUEST_SOURCE` وغياب evidence أو provenance يمنعان `FACTS_ACCEPTED`. قبول fact لا يساوي publication.

## Claim Integrity Audit

كل claim يحمل sourceFactIds وevidenceIds وprovenance وconfidence/classification في existing contract، ويعتمد guard الجديد على source linkage وreview status. الحالات `NEEDS_SOURCE` و`CONFLICT` تمنع DRAFT_REVIEWED، وACCEPTED/EDITED/REJECTED لا تنشئ Person/Profile ولا تنشر.

## Quality Gate Audit

الـquality evaluator يفحص:

| check | failure code/reason |
|---|---|
| valid document | DOCUMENT_INVALID |
| successful extraction | EXTRACTION_FAILED |
| fact review | FACT_REVIEW_REQUIRED |
| claim review | CLAIM_REVIEW_REQUIRED |
| source conflicts | CONFLICT_UNRESOLVED |
| output schema/validity | OUTPUT_INVALID |
| forbidden content | FORBIDDEN_CONTENT |
| unsafe URL | UNSAFE_URL |
| secret-like output | SECRET_LIKE_OUTPUT |
| draft-only state | PUBLICATION_STATE |
| claims present | CLAIMS_MISSING |

النتائج structured: `PASS` أو `PASS_WITH_LIMITATIONS` أو `BLOCKED`، مع reasonCodes وblockingFields.

## Persistence and Recovery Audit

لا توجد server persistence في workspace المحلي، ولذلك لا يدعي التنفيذ Saved أو autosave. الحفظ يحدث فقط عبر user action `Save as local draft` إلى browser localStorage، وتظهر `Saved locally in this browser only`. عند refresh تُستعاد state bounded وتظهر Continue restored state وDiscard local state.

`beforeunload` warning يظهر عندما توجد dirty changes، لكنه ليس بديلًا عن server-side optimistic concurrency. revision guard المركزي يمنع stale overwrite متى استُخدم في persistence layer.

لا يوجد `setInterval` أو fake autosave أو background network request.

## Review Integrity Audit

| review surface | supported action | publication implication |
|---|---|---|
| facts | Accept/Edit/Reject/Request Source | لا نشر |
| claims | Accept/Edit/Reject/Request Source | لا نشر |
| final editorial review | quality gate + local save | لا Person/Profile ولا نشر |

Reviewer note optional ومحدود إلى 500 حرف في UI المحلي. لا يغير original fact value.

## Security Audit

- server-side permission contracts وRBAC لم تتغير.
- admin route يظل protected.
- same-origin/CSRF guards الحالية لم تتغير.
- workflow guard يرفض actor غير authenticated أو permission غير صحيحة.
- prompt boundary السابقة تفصل SYSTEM_INSTRUCTIONS عن DOCUMENT_DATA وEDITORIAL_CONTEXT.
- untrusted document content لا يملك tools أو secrets أو permissions أو publication أو database control.
- لا توجد production provider calls أو external network inference.

## Privacy and Publication Audit

| surface | result |
|---|---|
| public HTML | لا AI workspace data |
| public search | لا AI documents/facts/claims |
| sitemap | لا AI records |
| OG/JSON-LD | لا AI private content |
| public APIs | لا extracted text/evidence/payloads |
| storage keys/secrets | غير مكشوفة |
| Person/Profile creation | disabled |
| publication | disabled |

Production GET-only privacy scan بعد deployment أعاد `CLEAN`.

## Operational and Idempotency Boundary

تظل provider/storage/scanner/queue/worker/OCR/retention production dependencies غير مهيأة، لذلك لا يدعي هذا audit تشغيلًا موزعًا. Existing Phase 17.18.9 sandbox يغطي deterministic Mock Provider وretry/idempotency behavior؛ Phase 17.18.12 يضيف integrity guard وstale revision على مستوى contract.

لا توجد database migrations أو DDL/DML أو seed. `pnpm test:integration` لم يُشغّل لأن safe isolation غير متاحة.

## Validation Evidence

```text
pnpm install --frozen-lockfile  PASS
pnpm typecheck                 PASS
pnpm lint                      PASS
pnpm vitest run tests/phase17.18.12.test.ts  PASS (7/7)
pnpm test                      PASS (29 files / 214 tests)
pnpm build                     PASS (71/71 pages)
git diff --check               PASS
```

## Known Limitations

هذه المراجعة لا تعادل:

- authenticated browser walkthrough
- Firefox/Safari/WebKit verification
- screen-reader verification
- measured WCAG 2.2 AA evidence
- isolated DB migration/persistence verification
- multi-user distributed concurrency/load test
- real provider/storage/scanner/queue/OCR/retention execution

## Final Audit Result

**PASS WITH LIMITATIONS.** Integrity rules وguards وDRAFT boundary وlocal recovery وprivacy boundary مثبتة باختبارات محلية. لا توجد موافقة لتفعيل AI Production أو provisioning أو migration أو Population.

**STOP AFTER PHASE 17.18.12.**
