# A3LAM Launch Readiness

## Scope and status vocabulary

This checklist is the release gate for Phase 17.7. It records only evidence available in the repository, local validation, and permitted read-only Production checks. `READY` means the item is evidenced and operational within the tested boundary. `READY WITH LIMITATION` means the core path exists but an external or configuration boundary remains. `REQUIRES CONFIGURATION` means owner-managed setup is required. `NOT TESTED` means the required environment or evidence was unavailable. `BLOCKED` is reserved for a material stop condition. `DEFERRED` is outside this phase.

## Readiness matrix

| Area | Status | Evidence or limitation |
|---|---|---|
| Application | READY WITH LIMITATION | Next.js application, local build, and Production deployment `dpl_3CyKAgDNG42yUaEtnX9o43M5EuCE` are READY on `a3-lam.vercel.app`; real-user E2E remains outside this sprint |
| Database | READY WITH LIMITATION | PostgreSQL/Drizzle and migrations 0001–0006 are present and Production registry is consistent; private-host provisioning is documented, not executed here |
| Authentication | READY WITH LIMITATION | Separate user/Admin sessions and protected routes exist; credential rotation and real-user E2E are owner operations |
| RBAC | READY | Existing effective-permission path and server-side authorization remain the source of truth |
| Admin | READY WITH LIMITATION | Dashboard, users, identities, sessions, audit, content, Site Experience, and system surfaces are available; external responsive verification remains pending |
| Public profiles | READY WITH LIMITATION | Published projection and privacy boundary exist; population and full content coverage are intentionally deferred |
| Search | READY WITH LIMITATION | Public route/API are available and bounded; semantic search is deferred |
| SEO | READY WITH LIMITATION | Canonical, Open Graph, JSON-LD, robots, and sitemap paths exist; custom-domain verification is deferred |
| Storage | REQUIRES CONFIGURATION | External object-storage provider is optional and safely unavailable until owner configuration |
| Email | REQUIRES CONFIGURATION | No provider is configured; application must retain `PROVIDER_NOT_CONFIGURED` behavior |
| Security | READY WITH LIMITATION | Server-side auth/RBAC, safe headers, public projection, same-origin mutations, and no-secret checks are present; external penetration testing is not part of this phase |
| Performance | READY WITH LIMITATION | Bounded lists, normal Node production build/server, and health probe are available; production load testing is not performed |
| Docker | READY WITH LIMITATION | Dockerfile/Compose and handoff docs are present; Docker CLI was unavailable in the development sandbox, so image/config commands are `NOT TESTED` here |
| VPS | READY WITH LIMITATION | Direct Node and Compose procedures plus Nginx guidance are documented; no external VPS was provisioned |
| Domain | READY WITH LIMITATION | DNS/TLS/canonical runbook is documented; no real custom domain was supplied or changed |
| HTTPS | READY WITH LIMITATION | Vercel provides the current HTTPS deployment; private-host certificate issuance is documented but not executed |
| Android | READY WITH LIMITATION | Android wrapper contract and package identity are documented; Android SDK/Gradle/device verification is unavailable |
| Backups | READY WITH LIMITATION | `pg_dump`/`pg_restore` and isolated restore verification procedure are documented; no destructive restore was executed |
| Monitoring | READY WITH LIMITATION | Safe `/api/health`, logs, and troubleshooting guidance exist; no external monitoring provider is configured |
| Documentation | READY | Repository, deployment, environment, database, domain, backup, troubleshooting, Android, and release documents are present |
| Analytics | DEFERRED | Explicitly outside Phase 17.7 |
| Population | DEFERRED | Explicitly forbidden in Phase 17.7 |
| AI/semantic search | DEFERRED | Explicitly outside Phase 17.7 |
| Store publishing | DEFERRED | No Google Play or App Store release is attempted |

## Release gate

The project may be treated as an **A3LAM Release Candidate with limitations**: local validation passed, Vercel production deployment `dpl_3CyKAgDNG42yUaEtnX9o43M5EuCE` is `READY`, public GET-only smoke passed, unauthenticated Admin API checks returned `401` where applicable, and authenticated Admin routes loaded in the existing session. Before a private-host or Android release, the owner must complete the items marked `READY WITH LIMITATION`, `REQUIRES CONFIGURATION`, or `NOT TESTED` in their target environment.

No item in this document authorizes a migration, seed, Production data creation, credential change, provider setup, or domain cutover.
