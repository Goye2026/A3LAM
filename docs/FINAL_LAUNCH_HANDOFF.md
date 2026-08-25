# PHASE 17.9 — FINAL LAUNCH FREEZE & HANDOFF

## Launch status

> **PRODUCT STATE:** Launch-ready foundation with documented external prerequisites.
>
> **POPULATION:** NOT STARTED.
>
> **PRODUCTION CONTENT:** No population was performed during Phase 17.9.
>
> **ANDROID:** Foundation ready; external build and signing verification required.
>
> **SELF-HOSTING:** Documented; external infrastructure verification required.
>
> **CUSTOM DOMAIN:** Not configured; DNS/HTTPS cutover deferred.
>
> **BACKUPS:** Runbook documented; real restore drill deferred.
>
> **ACCESSIBILITY:** Reviewed internally; external WCAG and screen-reader audit deferred.

## Current architecture

A3LAM is a Next.js App Router application using React, TypeScript, PostgreSQL, Drizzle, server-side REST route handlers, separate public-user and Admin session boundaries, server-side RBAC, publication filtering, privacy-aware projections, and external-provider abstractions for optional storage/email capabilities. The public interface is Arabic-first and RTL-ready; the application structure remains ready for future English/LTR localization.

The core public objects remain structured database entities rather than static articles. Public pages expose only published content, while Admin and account surfaces remain protected by server-side authorization. The migration runner and registry remain part of the operational architecture; this phase did not change them.

## Current Production state

The current public alias is [https://a3-lam.vercel.app](https://a3-lam.vercel.app). The latest Phase 17.8 deployment and read-only smoke verified the public routes, health endpoint, SEO files, security headers, public privacy scan, and anonymous Admin boundaries. The current Vercel project metadata reports Node.js `24.x`; no Vercel runtime or environment setting was changed in Phase 17.9.

## Migration state

The expected Production registry is:

| Migration | State |
|---|---|
| 0001 | APPLIED |
| 0002 | APPLIED |
| 0003 | APPLIED |
| 0004 | APPLIED |
| 0005 | APPLIED |
| 0006 | APPLIED |
| Pending | 0 |
| Unexpected | 0 |
| Inconsistent | 0 |

Do not run the migration runner merely to confirm this state. Do not create or apply a migration in this freeze.

## Admin/RBAC and Site Experience

Admin authentication remains separate from public-user authentication and uses the existing Admin session/token primitives. Permission checks remain server-side at both page and API boundaries. Admin pages without a session redirect to `/admin/login`; Admin APIs without a session return safe unauthorized responses. The Site Experience control center remains permission-aware, and `/admin/system` remains a read-only operational surface with no public migration/debug endpoint.

## Public profiles and authentication

Published person and professional-profile projections remain filtered by publication and visibility state. Private contact information, private files, session values, password hashes, and internal database state must not enter public responses. `/account` remains protected, user ownership remains server-side, and `/register`/`/login` use the existing public-user session architecture independently of `a3lam_admin_session`.

## Security and SEO

The repository retains secure response headers, HTTPS-oriented origin configuration, same-origin mutation checks, internal redirect sanitization, HttpOnly/SameSite Admin cookies, public JSON-LD limited to visible published content, canonical metadata, Open Graph/Twitter metadata, robots, and sitemap behavior. A full penetration test, CSP certification, screen-reader audit, WCAG contrast measurement, and cross-browser certification remain external work.

## Docker/VPS portability

Use `Dockerfile`, `.dockerignore`, and `docker-compose.yml` for the private-host baseline. The image pins Node.js `22.13.0` and pnpm `11.21.0`, runs the production server with `pnpm start` as the non-root `node` user, and uses PostgreSQL health-gating with a persistent named volume in Compose. Docker build and Compose validation were not executed because Docker CLI was unavailable.

For direct Node operation, use `.node-version`, `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start` under a process supervisor. Place Nginx or another reverse proxy in front, terminate TLS, keep PostgreSQL private, and set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin. Detailed procedures are in `docs/DEPLOYMENT.md`, `docs/SELF_HOSTING.md`, `docs/ENVIRONMENT.md`, and `docs/PRODUCTION_RUNBOOK.md`.

## Domain/HTTPS

No custom domain or DNS record was changed. For a future domain, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin, configure DNS and TLS, forward proxy headers correctly, verify canonical/robots/sitemap/health, and repeat same-origin login/logout smoke. The current Admin cookie intentionally has no expanded domain; do not broaden it without a separate security decision. See `docs/DOMAIN_SETUP.md`.

## Backup/restore

Backups belong outside the application host and must be encrypted and access-controlled. Use custom-format `pg_dump` with a protected path, checksum the artifact, and test `pg_restore` against a separate database. Never test a restore over the live database. See `docs/BACKUP.md`, `docs/RESTORE.md`, and `docs/DISASTER_RECOVERY.md`.

## Android

The wrapper foundation uses app name `A3LAM | أعلام`, application ID `org.a3lam.app`, HTTPS-only configuration, RTL expectations, and no embedded secrets. The Android SDK, Gradle, emulator/device, and release keystore were unavailable; therefore no APK/AAB was built and no signing readiness is claimed. See `android/README.md` and `docs/ANDROID_RELEASE.md`.

## Exact operator commands

The following commands are safe starting points for a new private host after secrets and PostgreSQL are provisioned through approved operational channels:

```bash
# verify the approved release and install reproducibly
git checkout <approved-release-commit>
pnpm install --frozen-lockfile

# validate and build
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# start the normal production server
pnpm start

# read-only health check
curl -fsS http://127.0.0.1:3000/api/health
```

For Compose, first create a protected untracked `.env` from `.env.example`, then run `docker compose config`, `docker compose up -d --build`, `docker compose ps`, and the health check. Never run seed in Production. Never run a migration on an existing database just to test the deployment.

## Recommended first steps after this session

The product owner should first preserve the current Git release and verify that `HEAD == origin/main`. Next, an infrastructure operator should validate Docker/Compose or direct Node on the chosen private host, complete TLS/domain configuration if needed, establish encrypted backups, and perform an isolated restore drill. Separately, an Android operator should install the SDK and Gradle, build the wrapper on a real device, configure signing in a secret manager, and verify deep links, RTL, back navigation, and network failure states. Only after explicit approval should a future phase address Population.

## Boundaries

Phase 17.9 created no users, Admins, Editors, People, Categories, Profiles, CVs, Files, seed records, or Production mutations. It created no migration, changed no schema, changed no credentials/providers/Vercel environment, provisioned no VPS, performed no DNS cutover, and added no temporary/debug route.

`Population remains NOT STARTED.`  
`Phase 18 remains NOT STARTED.`
