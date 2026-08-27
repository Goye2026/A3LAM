# Phase 17.18.9 — Sandbox Evidence

**Run date:** 27 August 2026

**Purpose:** Supporting evidence for the controlled, synthetic, deterministic, in-memory AI Profile Builder sandbox. This file is not Production activation evidence.

## Isolation statement

The test run used `SANDBOX_ISOLATION`:

| Control | Value |
|---|---|
| environment | `test-only-isolated-memory` |
| database | `IN_MEMORY_ONLY` |
| productionDatabase | `false` |
| network | `false` |
| realProvider | `false` |
| realStorage | `false` |
| realScanner | `false` |
| realQueue | `false` |

No `DATABASE_URL` was used. No real document, user, secret, provider, storage credential, OCR service, queue worker, or malware service was used.

## Evidence map

| Required control | Test evidence |
|---|---|
| Synthetic ingestion | `phase17.18.9.test.ts` — isolation and actual extraction cases |
| checksum/idempotency | inherited `IsolatedAiHarness` plus queue duplicate key test |
| scanner states | explicit SAFE, INFECTED, SCAN_ERROR, UNAVAILABLE matrix |
| private storage | owner isolation, safe key, traversal rejection, detach, delete, metadata |
| queue/worker | enqueue, dequeue, in-flight delivery dedupe, backoff, exhaustion, stale, unavailable |
| TXT/PDF/DOCX | actual `documentIngestionService` through `IsolatedAiHarness` |
| extraction negatives | empty, malformed PDF/DOCX, suspicious archive, OCR_REQUIRED, oversize, unsafe filename |
| fact review | ACCEPT, EDIT, REJECT, REQUEST_SOURCE with original value and provenance |
| provider | deterministic Mock Provider only |
| generation matrix | 5 modes × 4 languages = 20 combinations |
| output safety | malformed, missing evidence, unsupported claims, unsafe URL, secret-like, instruction-like |
| prompt boundary | untrusted content stays in `DOCUMENT_DATA`; system message unchanged |
| quality gate | PASS_WITH_REVIEW, REJECTED, FAILED outcomes; never Published |
| claim review | ACCEPT and REQUEST_SOURCE in complete lifecycle; inherited suite covers all actions |
| publication | `PUBLICATION_BLOCKED_DRAFT_ONLY` |
| Person/Profile | explicit blocked creation attempts |
| RBAC | ADMIN/SUPER_ADMIN generation; EDITOR review/read; MODERATOR no AI scope |
| CSRF | same-origin accepted; cross-origin rejected via helper |
| operations | upload rate limit, zero-limit role, concurrency ceiling, max retries |
| retention | policy eligibility, executor-not-configured, owner-scoped deletion |
| telemetry | correlation ID, stage, attempt, safe allowlist, raw-content redaction |
| public privacy | inherited source scan plus production GET-only privacy scan |

## Deterministic lifecycle evidence

The complete isolated path reached a generated structured draft with `draftStatus=DRAFT` and a `PASS_WITH_REVIEW` quality gate. Human review accepted a synthetic claim and produced a filtered final draft. A second synthetic claim was marked `REQUEST_SOURCE` and was excluded from the final draft. No path was allowed to call publication, create a Person, or create a Profile.

The queue test proved that two concurrent deliveries for the same job resulted in one worker execution. Retry behavior was bounded to three attempts; the third failed permanently. A stale running job was converted to `FAILED` with `STALE_JOB`, and a worker unavailable state rejected enqueue.

## Failure and recovery evidence

The inherited in-memory harness still covers storage put failure, queue enqueue failure, scanner failure, extraction failure, cleanup, document checksum dedupe, generation idempotency, timeout, provider failure, and bounded retry. Phase 17.18.9 adds explicit status-level scanner and queue behavior without changing Production contracts.

## Production separation

The production readiness contracts remain configuration-required or disabled. In particular, the real provider is `NOT_CONFIGURED`, storage/queue/scanner/OCR/retention dependencies are not provisioned for this phase, and automatic deletion remains disabled. Production smoke used only GET requests and returned public 200 responses, anonymous admin 307 redirects, protected AI API 401 responses, and a clean privacy scan.

## Validation command evidence

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm vitest run tests/phase17.18.9.test.ts` | PASS — 14/14 |
| `pnpm test` | PASS — 26 files / 186 tests |
| `pnpm build` | PASS — 71/71 pages |
| `git diff --check` | PASS |
| `pnpm test:integration` | NOT RUN — no proven isolated DB |

## Explicit evidence boundary

Sandbox counters must not be substituted for Production counters. Production mutations, provider calls, uploads, migrations, People, Profiles, and public AI profiles remain zero. This evidence supports `PASS WITH LIMITATIONS`; it does not authorize Production activation or population.
