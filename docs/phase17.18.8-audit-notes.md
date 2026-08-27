# Phase 17.18.8 — Initial Audit Notes

## Scope and safety

The phase is audit/readiness only. No Production AI inference, upload, document/job creation, processing, generation, OCR, publication, migration runner, DDL/DML, seed, provider/storage/queue/scanner/OCR provisioning, secret, environment, DNS, or billing mutation is authorized.

## Current code evidence reviewed

- `lib/ai/generation/prompt.ts` separates fixed system instructions from `DOCUMENT_DATA`, treats extracted values as untrusted, bounds prompt data to 200,000 bytes, and explicitly prohibits publication, Person/Profile creation, tool calls, secret disclosure, and permission changes.
- `lib/ai/generation/validation.ts` enforces bounded input/output, confidence/classification checks, provenance/evidence requirements, source conflict status, URL/provenance checks, secret-like and instruction-like output blocking, and draft-only quality-gate behavior.
- `lib/db/schema.ts` models AI documents, processing jobs, extracted sources/facts/evidence/reviews, generation jobs/attempts/claims/review decisions with foreign keys, indexes, uniqueness/idempotency indexes, bounded status fields, and cascade/set-null relationships.
- Migration `0007_phase17_16_media_architecture.sql` is additive and defines storage-key safety, MIME/extension/size/dimension checks, source URL checks, visibility/status checks, and restrictive person-media linkage.
- Migration `0008_phase17_18_2_ai_ingestion_review.sql` is additive and defines bounded document/text/evidence fields, checksum/idempotency indexes, owner/status constraints, review states, and AI permissions; it remains CREATED / NOT APPLIED.
- Migration `0009_phase17_18_4_ai_generation.sql` is additive and defines generation statuses, retry bounds, quality-gate states, error taxonomy, JSON size bounds, claim arrays/provenance, review actions, and AI generation permission; it remains CREATED / NOT APPLIED.
- `lib/admin/rbac.ts` preserves least privilege: `ADMIN` receives normal permissions excluding system migrations and role-management permissions; `EDITOR` has `ai.documents.read` and `ai.review` but not generation; `MODERATOR` has no AI permission; `SUPER_ADMIN` is the full role.
- `lib/user/requestSecurity.ts` provides same-origin mutation checks; AI mutation routes also retain server-side auth, permission, same-origin, feature-gate, and dependency checks.
- Public-route review found no AI document/job/fact/claim references in public search/sitemap projection paths; public surfaces project published people/profiles only.

## Preliminary decision posture

No evidence of a P0 publication bypass, secret exposure, arbitrary code execution, or uncontrolled provider call has been observed in the inspected code. Production activation cannot be approved because external infrastructure, AI persistence migrations, provider, private storage, scanner, queue/worker, OCR, retention, distributed rate limits, cost controls, and production observability are not verified/configured. The expected decision posture is `GO WITH LIMITATIONS`, subject to completing the remaining read-only audit and validations.

## Additional audit evidence

- `lib/ai/generation/persistence.ts` derives an idempotency key from owner, document, mode, and language; checks for existing jobs; caps attempts at three; scopes all reads/writes through the document owner; writes attempt/review/audit records transactionally; and validates claim provenance before persistence.
- All discovered AI mutation routes use server-side permission checks and same-origin checks. Upload additionally requires the production, upload, and processing gates; generation additionally requires production, processing, and generation gates. Fact/document/claim review remains permission- and owner-scoped.
- `lib/ai/ingestion.ts` exposes bounded deterministic TXT/PDF/DOCX extraction only. TXT uses fatal UTF-8 decoding; PDF and DOCX parser errors are mapped to controlled extraction errors; scanned PDFs remain OCR-required when no text layer is available; candidate facts carry document-backed provenance.
- The readiness vocabulary now contains 22 unique capability keys, including prompt boundary, publication guard, and rollback. Each readiness item includes status, evidence, owner, verification method, next action, and blocker flag.

## Audit classification used for this phase

The absence of Production infrastructure is an activation prerequisite and is recorded as `GO WITH LIMITATIONS`, not as a fabricated `READY`. Any future evidence of public private-data leakage, unauthorized access, publication bypass, secret exposure, arbitrary code execution, or destructive mutation would require a `NO-GO` decision and P0/P1 escalation. No such active bypass was found in the inspected code paths.
