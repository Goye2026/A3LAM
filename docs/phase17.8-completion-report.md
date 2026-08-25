# Phase 17.8 — Final Launch & Portability Hardening

## 1. Executive Summary

Phase 17.8 hardens the existing A3LAM Release Candidate for final launch handoff and private-hosting portability. The work is limited to runtime-parity documentation, Docker/VPS/self-hosting guidance, domain and HTTPS readiness, backup/restore and disaster-recovery runbooks, Android wrapper/release preparation, security/SEO/UX/accessibility audit evidence, and reproducible verification.

The existing Next.js/PostgreSQL/Auth/RBAC/publication/privacy architecture is preserved. No Population, seed data, new migration, schema change, Production DDL/DML, user/admin/editor/profile/person/category/CV/file creation, provider credential, Vercel configuration change, temporary Production endpoint, authentication rewrite, or Phase 18 work is included.

Final status is **PHASE 17.8 — COMPLETE WITH LIMITATIONS**. The release deployment and final read-only Production verification are recorded below. Docker and Android remain honest external-verification boundaries.

## 2. Changes

The portability baseline is now explicit through `.node-version` (`22.13.0`) and the existing pinned `packageManager` (`pnpm@11.21.0`). The Docker runtime now executes as the non-root `node` user while retaining the normal Next.js production command `pnpm start`. No `engines` field was added because the Vercel project currently reports Node.js `24.x`, and this phase must not implicitly change the managed Vercel runtime.

Root-level operational documents were added for launch readiness, deployment, backup, restore, disaster recovery, domain setup, Android release, self-hosting, environment management, and Production operations. The existing nested deployment runbooks remain the detailed source for Docker, VPS, PostgreSQL, domain, backup/restore, and troubleshooting procedures.

Static tests were added for runtime parity, non-root Docker operation, health-gated Compose, root-level runbook presence, Android release boundaries, and GET/HEAD-only Production policy. No application business logic was rewritten.

## 3. Docker Status

**READY FOR EXTERNAL VERIFICATION.** The repository contains a multi-stage Node.js `22.13.0` Dockerfile, `.dockerignore`, and a Compose topology with PostgreSQL 16 Alpine, internal networking, named database volume, database health gating, and an application healthcheck at `/api/health`. The final runtime uses `USER node` and `pnpm start`.

The Docker CLI is unavailable in the current sandbox. Therefore `docker build` and `docker compose config` are **NOT TESTED** here. No Docker PASS is claimed. The target operator must execute both commands and attach output before declaring the container release complete.

## 4. VPS Portability Status

**READY FOR EXTERNAL VERIFICATION.** `docs/SELF_HOSTING.md`, `docs/DEPLOYMENT.md`, and `docs/deployment/` document Ubuntu/Linux requirements, Node/pnpm baseline, PostgreSQL provisioning, protected environment values, direct Node operation, Docker Compose operation, non-root execution, reverse proxy assumptions, HTTPS termination, health checks, log inspection, rollback, storage/email configuration, and migration boundaries.

No VPS was provisioned, modified, or accessed by this phase.

## 5. Android Status

**ANDROID FOUNDATION READY; ANDROID REQUIRES EXTERNAL BUILD ENVIRONMENT.** The existing wrapper foundation remains HTTPS-only with app name `A3LAM | أعلام`, application ID `org.a3lam.app`, placeholder production URL configuration, RTL expectations, deep-link/back-navigation requirements, and secret isolation. `docs/ANDROID_RELEASE.md` documents debug/release separation, signing, Play Store preparation, versioning, and artifact inventory.

The sandbox has no Android SDK, Gradle, emulator, physical device, or release keystore. No APK/AAB was built or claimed. Release signing is **RELEASE SIGNING = NOT CONFIGURED**.

## 6. Domain Readiness

**READY FOR EXTERNAL VERIFICATION.** `docs/DOMAIN_SETUP.md` documents a future HTTPS custom domain, DNS and certificate sequence, reverse proxy headers, canonical and absolute URL behavior, robots and sitemap checks, redirect validation, same-origin mutation assumptions, cookie-domain behavior, and rollback.

`NEXT_PUBLIC_SITE_URL` remains the canonical origin input and must be set to the final HTTPS origin in Production. No custom domain, DNS record, certificate, CORS policy, cookie domain, or Vercel setting was changed.

## 7. Backup Readiness

**READY FOR EXTERNAL VERIFICATION.** `docs/BACKUP.md`, `docs/RESTORE.md`, and `docs/DISASTER_RECOVERY.md` provide protected `pg_dump`/`pg_restore` examples, retention guidance, checksums, pre-migration backup policy, isolated restore verification, incident procedure, RPO/RTO ownership, cutover approval, and rollback rules.

No Production backup was created and no destructive restore was executed because credentials and an isolated recovery environment were not available and the phase forbids Production mutation.

## 8. Security Audit

The read-only/static audit reviewed Admin authentication isolation, server-side authorization and effective permissions, ownership/privacy projection, private contact and file boundaries, JSON-LD, sitemap, Open Graph, robots, API/error outputs, cookies, same-origin validation, redirect sanitizer, URL scheme assumptions, and security headers.

The existing security headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, strict-origin referrer policy, restrictive camera/geolocation/microphone permissions, and production HSTS. Admin cookies remain HttpOnly, SameSite Lax, secure in Production, path-scoped, and without an expanded cookie domain. No secret value was printed or committed. No CSP was added because external assets/provider behavior was not comprehensively audited; this remains a hardening item for a dedicated security review rather than an unverified claim.

## 9. SEO Audit

The public metadata audit reviewed title, description, canonical, Open Graph, Twitter, JSON-LD, robots, sitemap, noindex behavior for search/auth/admin/private surfaces, and absolute URL handling. The homepage has an explicit canonical override, public person pages use visible published content for structured data, search and auth pages retain noindex behavior, and Admin paths are excluded from robots.

Custom-domain absolute URL correctness remains dependent on the owner setting `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin. No unsupported structured data or hidden private metadata was added.

## 10. UX Audit

The public surface continues to clearly separate the editorial encyclopedia from user-owned professional profiles. The homepage exposes the A3LAM identity, editorial value proposition, search and category discovery, and profile CTA without inventing unavailable data. Existing loading, empty, error, unavailable, unauthorized, forbidden, and publication-state behavior remains intact.

Admin navigation remains permission-aware and server-authorized. The reviewed dashboard, users, administrators, editors, sessions, audit, people, categories, profiles, Site Experience, and System areas retain clear labels and read-only/mutation distinctions. No mutation was activated during the audit.

## 11. Accessibility Status

**READY FOR EXTERNAL VERIFICATION.** Local Chromium visual smoke evidence was collected at 390×844, 393×852, 768×1024, and 1440×900. The captured pages showed RTL header/navigation, readable typography, contained hero and CTA regions, and no immediately visible horizontal clipping in the reviewed viewports.

This evidence is not a screen-reader certification, keyboard-only certification, measured WCAG 2.2 AA contrast report, Firefox/Safari certification, or physical-device test. Those remain external verification items.

## 12. Tests

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 13 test files, 76 tests |
| `pnpm build` | PASS — 66 generated routes/pages |
| `git diff --check` | PASS |
| Local production server and `/api/health` | PASS — `status: ok`, `service: a3lam` |
| Static UX/security/SEO audit | PASS WITH LIMITATION — recorded in external evidence artifact |
| Chromium visual smoke | PASS WITH LIMITATION — four genuine local screenshots |
| Docker build/config | NOT TESTED — Docker CLI unavailable |
| Android build/device/signing | NOT TESTED — Android toolchain and keystore unavailable |

## 13. Production Verification

Final Production verification was GET/HEAD-only. No POST, PUT, PATCH, DELETE, form submission, migration action, publication action, archive action, session revocation, filter application, login of a new user, profile creation, CV creation, or data mutation was performed.

The implementation commit `a031381034c5b020deae30eac6d891b1047f0ceb` deployed to Production as `dpl_Mhuj1ihEYCLtfxisf5yH9UuGsgCn`, target `production`, source `git`, state `READY`, and alias `https://a3-lam.vercel.app`.

| Check | Evidence | Result |
|---|---|---|
| `/`, `/categories`, `/search`, `/register`, `/login`, `/robots.txt`, `/sitemap.xml` | `phase17.8-production-public.txt` | PASS — HTTP 200 |
| `/api/health` | `phase17.8-production-public.txt` | PASS — HTTP 200; `status=ok`, `service=a3lam` |
| Security response headers | `phase17.8-production-public.txt` | PASS — nosniff, SAMEORIGIN, strict-origin referrer policy, restrictive Permissions-Policy, and HSTS observed |
| Homepage canonical and public privacy scan | `phase17.8-production-public.txt` | PASS — HTTPS canonical observed; no database URL, Admin token/session, password hash, schema marker, or Set-Cookie leakage found |
| Admin pages without session | `phase17.8-production-public.txt` | PASS — `/admin`, `/admin/users`, `/admin/categories`, and `/admin/system` returned `307` to `/admin/login` with internal `next` paths |
| Admin APIs without session | `phase17.8-production-public.txt` | PASS — collection/system endpoints returned `401` |
| Runtime errors | Vercel runtime logs scoped to `dpl_Mhuj1ihEYCLtfxisf5yH9UuGsgCn`, production, error/fatal, last hour | PASS — no logs found for the specified criteria; grouped-error query separately timed out and was not used as evidence |

The final Production checks were read-only and did not create or alter records. Existing Admin migration registry and dashboard observations from the current authorized session remain consistent with the Phase 17.7 baseline: 6 applied, 0 pending, 6 expected; existing media/email configuration limitations remain. The Vercel project metadata still reports Node.js `24.x`; no Vercel runtime setting was changed.

## 14. Git Status

The implementation commit `a031381034c5b020deae30eac6d891b1047f0ceb` is on `main` and was pushed normally. The documentation closeout commit is the normal commit containing this final report and is recorded in the final Git closeout. The required final state is `main`, a clean working tree, and `HEAD == origin/main`. No force push, reset, rebase, or history rewrite is permitted.

## 15. Deferred Items

Population, synthetic or Production seed data, Phase 18, semantic search, AI, analytics, external monitoring, email provider, storage provider, real custom-domain cutover, DNS/certificate changes, Docker execution in a Docker-enabled environment, Android SDK/device build, release signing, Play Store/App Store publication, full cross-browser verification, screen-reader verification, measured WCAG 2.2 AA evidence, penetration testing, load testing, and real-user E2E remain deferred or owner-configured.

## 16. Blockers

No application or schema blocker was discovered in the Phase 17.8 slice. Docker and Android are environment limitations. Strict Vercel Node.js 22.13.0 parity is an owner configuration decision because the current Vercel project metadata reports Node.js `24.x`; this phase deliberately did not change it. A future requirement for migration, schema change, Production DDL/DML, secret, credential, provider, authorization bypass, or destructive restore must be recorded as `BLOCKED` and stopped.

## 17. Launch Readiness Matrix

| Area | Status | Evidence | Limitation |
|---|---|---|---|
| Web application | PASS WITH LIMITATION | Local validation and Production GET-only smoke | No full real-user E2E |
| Runtime parity | PASS WITH LIMITATION | `.node-version`, Docker pin, packageManager pin | Vercel reports Node.js 24.x |
| Docker | READY FOR EXTERNAL VERIFICATION | Dockerfile, Compose, non-root runtime, healthcheck | Docker CLI unavailable |
| VPS/self-hosting | READY FOR EXTERNAL VERIFICATION | Root and nested runbooks | No VPS execution |
| Domain/HTTPS | READY FOR EXTERNAL VERIFICATION | Domain and reverse-proxy runbook | No DNS/TLS cutover |
| Backup/restore | READY FOR EXTERNAL VERIFICATION | Three recovery runbooks | No Production backup/restore |
| Android | READY FOR EXTERNAL VERIFICATION | Android wrapper and release handoff | No SDK/device/keystore |
| Security | PASS WITH LIMITATION | Static audit and privacy boundaries | No external penetration test or CSP certification |
| SEO | PASS WITH LIMITATION | Public metadata and robots/sitemap audit | Custom domain requires configuration |
| Accessibility | READY FOR EXTERNAL VERIFICATION | Local visual evidence | No screen-reader/WCAG measurement |
| Storage/email | REQUIRES CONFIGURATION | Existing abstractions and explicit states | No provider credentials |
| Population | DEFERRED | Phase boundary | No content mutations |
| Phase 18 | DEFERRED | Phase boundary | Not started |

## 18. Recommended Next Phase

The next authorized phase should be selected explicitly by the product owner after reviewing this Release Candidate. It should not begin automatically. Before any private-host or Android release, complete the external Docker, VPS, accessibility, device, signing, domain, backup-restore, and provider verification items in their target environments. Population and Phase 18 remain outside this closeout.

## Safety Counters

| Operation | Count |
|---|---:|
| Migrations executed | 0 |
| New migrations created | 0 |
| Production DDL/DML | 0 |
| Users/admins/editors created | 0 |
| People/categories/profiles/CVs created | 0 |
| Files uploaded | 0 |
| Seed records | 0 |
| Secrets changed | 0 |
| Vercel configuration changes | 0 |
| External providers configured | 0 |
| Temporary Production endpoints | 0 |

## Final Boundary

`Population — NOT STARTED`  
`Phase 18 — NOT STARTED`
