# A3LAM — Phase 17.7 Implementation Contract

## Objective

Prepare the existing A3LAM application as a Release Candidate without changing its core product architecture. This contract covers launch readiness, private-hosting portability, Docker artifacts, Android wrapper boundaries, and operational handoff documentation.

## Preserved Foundations

The implementation must preserve the locked Next.js/React/TypeScript/Node.js/pnpm baseline, the existing PostgreSQL and Drizzle architecture, the shared migration runner, the separate user/Admin session systems, the current RBAC vocabulary and server-side authorization, the publication lifecycle, the external object-storage abstraction, and the existing Vercel deployment option.

## Authorized Changes

| Workstream | Authorized outcome |
|---|---|
| Environment | Safe `.env.example` with names/placeholders and required/optional/provider-only classification |
| Containerization | Dockerfile, `.dockerignore`, and Docker Compose using placeholders, healthchecks, named database volume, and no committed secrets |
| Private hosting | Deployment, VPS, domain, Nginx/reverse-proxy, PostgreSQL, backup/restore, and troubleshooting runbooks |
| Release audit | Objective launch-readiness checklist and completion report with honest state labels |
| Health/operations | Safe health-check and operational guidance using existing endpoints; no external telemetry |
| Android | Maintainable wrapper/foundation documentation or project structure only where the available toolchain supports truthful verification; no fake APK/AAB claim |
| Fixes | Narrow bug, UX, responsive, SEO, security, or error-state fixes discovered during the audit |

## Prohibited Changes

Population, synthetic data, new categories or identities, migrations, schema changes, database seed operations, provider or secret configuration, authentication redesign, RBAC redesign, database architecture redesign, AI, semantic search, analytics, chat, social features, and Phase 18 are prohibited.

## Verification Contract

The required local commands are `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `git diff --check`. If Docker is installed, `docker build .` and `docker compose config` must be executed; otherwise they remain `NOT TESTED — Docker CLI unavailable`. Android build and device behavior must be reported as `REQUIRES DEVICE VERIFICATION` when SDK/Gradle/device tooling is unavailable.

Production verification is GET/HEAD-only. The existing authenticated Admin session may be used to inspect the listed Admin surfaces, but no button may be clicked merely to prove a mutation. No migration runner, seed script, database console, or Production data mutation may be invoked.

## Release Status Vocabulary

The completion report must use only these states: `READY`, `READY WITH LIMITATION`, `REQUIRES CONFIGURATION`, `NOT TESTED`, `BLOCKED`, and `DEFERRED`. Unsupported claims about accessibility, browser coverage, device behavior, Docker execution, Android builds, provider availability, or custom-domain cutover are not permitted.

## Stop Conditions

Stop the affected workstream and document the exact reason if it requires a migration, schema change, secret, provider, Production DML, test data, auth/RBAC bypass, Vercel environment change, destructive restore, or unavailable external infrastructure. Do not work around such a condition silently.

## Expected End State

The application remains deployable on Vercel, has a documented path to Docker/VPS/PostgreSQL/private hosting, has an honest Android wrapper boundary, has a launch-readiness record, and ends with `Population = NOT STARTED`, `Phase 18 = NOT STARTED`, `HEAD == origin/main`, and a clean working tree.
