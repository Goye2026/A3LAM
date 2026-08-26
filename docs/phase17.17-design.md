# A3LAM — Phase 17.17 Design Decision

## Decision summary

سيُبنى `/admin/launch` كـServer Component read-only داخل Admin Control Center، ويُحمى server-side بواسطة permission الحالية `system.read`. لن تُضاف permission جديدة لأن Launch Control هو orchestration/read model فوق System Health والـAdmin read models الموجودة، وليس domain mutation مستقلًا.

سيكون لكل readiness domain status typed موحد، مع فصل واضح بين الحالة والـevidence ومالك الإجراء التالي. سيُستخدم `READY_WITH_LIMITATIONS` عندما تكون foundation أو evidence الجزئية موجودة مع limitation معلنة، و`REQUIRES_CONFIGURATION` عندما تكون خطوة تشغيلية خارجية مطلوبة، و`NOT_TESTED` عندما لا يوجد evidence حقيقي، و`BLOCKED` فقط عند وجود مانع فعلي.

## Central status vocabulary

```text
READY
READY_WITH_LIMITATIONS
REQUIRES_CONFIGURATION
NOT_TESTED
BLOCKED
NOT_APPLICABLE
```

يُعرّف النوع مرة واحدة في module launch domain. لا تستخدم صفحة Launch Control نصوصًا حرة لتقرير الحالة، ولا تحول `NOT_TESTED` أو `REQUIRES_CONFIGURATION` إلى `READY`.

## Domain aggregation

| Domain | Primary evidence source | Expected read mode |
|---|---|---|
| Application | package/build metadata and health route evidence | automatic/read-only |
| Database | `getSystemHealthSnapshot()` | automatic |
| Migrations | `getMigrationRegistryStatus()` | automatic |
| Authentication | existing admin/auth configuration and protected-route evidence | automatic/read-only |
| RBAC | existing permission registry and `system.read` gate | automatic |
| Editorial | `adminRepository` counters plus pure Person evaluator | automatic, with manual source-review note |
| Media | existing system health/provider/schema state | automatic/external configuration |
| SEO/Public | existing public repository and route evidence | read-only/external verification |
| Site Experience | existing system health/site repositories | automatic/read-only |
| Backup/Restore | existing runbook/configuration documentation only | external/manual |
| Portability/Docker | existing runbooks and safe local capability checks | external/not tested when unavailable |
| Android | existing foundation documentation only | not tested/external |
| Domain/DNS | existing domain documentation and Production alias evidence | external configuration |

The aggregate uses independent domain reads. A failed optional domain produces a domain-level unavailable/error item rather than collapsing the entire page. The read model does not cache stale readiness state.

## Editorial Quality Gate

The evaluator is a pure function over a hydrated `PersonRecord` plus optional media projection. It returns required-field issues, recommended-field gaps, source indicators, media indicator, lifecycle-aware readiness, and a non-authoritative completeness summary. It measures presence and validation only; it does not assert historical truth or source reliability beyond the source fields already stored.

Required evaluation checks are name, Arabic name, slug, short biography, biography, at least one category, occupation values, and publication state. Relationship checks reuse the existing domain validators. A published record with invalid public categories, invalid sources, missing source references, or an unsafe non-empty image URL is `BLOCKED`. A missing portrait remains `Missing — Recommended`, because the current editorial policy treats portrait as optional. Recommended checks include portrait, source count/valid URL, short SEO description, and structured timeline/education metadata when applicable.

The evaluator does not transition Draft, Review, or Published. The existing `transitionStatus` and `validatePublishedRecord` paths remain the source of truth for mutation and publication.

## Launch checklist semantics

Checklist rows are evidence-derived and non-interactive in Phase 17.17. Each row includes a mode (`AUTOMATIC`, `MANUAL`, or `EXTERNAL`), a status, evidence text, and owner/next-step text. No checkbox can override a failed or untested automatic check. No manual acknowledgement is added because the current audit schema has no need for a new acknowledgement mutation.

## Performance and privacy

The first read model uses existing aggregate summaries and bounded read models rather than loading every person and every relation into the page. The quality gate is exposed for individual records and tested with pure fixtures. Aggregate editorial readiness uses counts available from safe server-side queries; no private fields, password hashes, session tokens, storage keys, credentials, or connection strings are returned.

## UI and localization

The page uses existing AdminShell layout, Arabic RTL messages, semantic headings, links, status text, loading/unavailable/error/partial states, and mobile-first grid/table styles. Metadata sets `robots: { index: false, follow: false }`. Links to People, Categories, Profiles, Users, Administrators, Sessions, Audit, Media, Site Experience, and System are permission-filtered using the same server-side vocabulary.

## Deferred by explicit boundary

No migration execution, provider provisioning, upload, backup/restore execution, DNS change, Vercel setting change, Android build/signing, Population, bulk import, or new public API is part of this design.

## Implementation references

The implementation must reuse [`systemHealth`](../lib/admin/systemHealth.ts), [`migrationRegistry`](../lib/admin/migrationRegistry.ts), [`adminRepository`](../lib/data/adminRepository.ts), [`RBAC`](../lib/admin/rbac.ts), [`AdminShell`](../components/a3lam/AdminShell.tsx), and [`domain validation`](../lib/domain/a3lam.ts).
