# A3LAM — Phase 17.7 Audit

## Status

This audit records the actual repository and environment state before the Phase 17.7 Release Preparation Sprint. The scope is limited to launch readiness, portability, Docker, Android foundation, security, documentation, and read-only verification. Population, seed data, new migrations, provider setup, secret changes, and Phase 18 are excluded.

## Baseline

| Item | Observed state | Decision |
|---|---|---|
| Git branch | `main` | Preserve; no reset, rebase, or force push |
| Node.js | `v22.13.0` | Preserve locked baseline |
| pnpm | `11.21.0` | Preserve locked baseline |
| Next.js | `16.3.1` | Preserve locked baseline |
| React | `19.2.8` | Preserve locked baseline |
| TypeScript | `6.0.2` | Preserve locked baseline |
| ESLint | `9.39.5` | Preserve reproducible project baseline |
| Database | PostgreSQL via `postgres`/Drizzle; migrations 0001–0006 applied in Production | Do not run migrations in this phase |
| Migration runner | `scripts/db-migrate.mjs` and shared runner | Keep as the only migration execution path |
| Production deployment | Vercel alias remains `https://a3-lam.vercel.app` | Preserve current deployment while adding portability |
| Docker CLI | Unavailable in the current sandbox | Add configuration, mark Docker execution untested here |
| Android SDK/Gradle/ADB | Unavailable in the current sandbox; Java is available | Add a documented Android wrapper foundation only if it can be maintained without unverified generated binaries |

## Repository Findings

The project is a Next.js App Router application using a server-side PostgreSQL client, Drizzle schema/migrations, separate public-user and Admin sessions, existing RBAC, external object-storage abstraction, and the existing Vercel deployment. The current package scripts already provide reproducible install, build, start, typecheck, lint, tests, and the sole migration command.

The current `.env.example` includes a localhost-shaped `DATABASE_URL` example and does not classify variables as required, optional, or provider-specific. It also lacks the handoff detail needed for Docker and private hosting. This is a documentation/configuration-hardening gap, not a reason to change the database architecture.

The current Next configuration contains only the known migration SQL output tracing required by the Admin system/preflight/execute routes. It does not use a Vercel-only API or Vercel filesystem storage. The external storage adapter already fails safely with a configuration state and has no filesystem or PostgreSQL blob fallback.

No `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `android/` project, `docs/deployment/`, or `docs/release/` directory existed at audit time. These are the principal Phase 17.7 deliverables. Docker execution cannot be claimed in this environment because the Docker CLI is absent. Android device and Gradle verification cannot be claimed because the required toolchain is absent.

## Gap Matrix

| Area | Current gap | Phase 17.7 treatment | Acceptance state |
|---|---|---|---|
| Web launch readiness | Existing product is deployed and locally validated, but no single release checklist exists | Add a factual launch-readiness checklist with READY, READY WITH LIMITATION, REQUIRES CONFIGURATION, NOT TESTED, BLOCKED, and DEFERRED states | Required |
| Environment | `.env.example` lacks classification and has a concrete local connection example | Replace with names plus safe placeholders and explicit required/optional/provider-only groups; never include a real secret | Required |
| Docker | No container artifacts | Add reproducible multi-stage Node image, `.dockerignore`, and Compose with PostgreSQL healthcheck and named volume | Required; build untested if Docker remains unavailable |
| PostgreSQL handoff | Existing README is useful but not a complete private-hosting runbook | Add deployment database and backup/restore runbooks; keep runner as sole migration path | Required |
| VPS/reverse proxy/domain | No handoff documents | Add Nginx, VPS, domain, HTTPS, and troubleshooting documentation without applying external server changes | Required |
| Android | No Android project and no native toolchain available | Prefer a documented Capacitor-style wrapper boundary; do not create an unbuildable fake native project or claim APK/AAB success | Ready with limitation / requires device verification |
| Storage | Existing server-side external object-storage abstraction; provider is optional | Document `REQUIRES CONFIGURATION`; do not add credentials or provider | Ready with limitation |
| Email | No provider is configured | Preserve safe `PROVIDER_NOT_CONFIGURED` behavior and document it | Requires configuration |
| Health | `/api/health` exists and returns safe application health | Document its safe use in container/VPS probes; do not expose connection details | Ready with limitation |
| Vercel | Current deployment must not break | Preserve alias and current runtime tracing; add portable artifacts without removing Vercel support | Required |
| Security | Existing auth/RBAC/session/public-projection controls are in place | Perform static and GET-only boundary audit; no auth/RBAC rewrite | Required |
| Responsive | Existing CSS is responsive-oriented; external browser evidence is not available | Run only available local checks and report unverified viewport/device claims honestly | Not tested where no genuine viewport evidence exists |

## Safety Gates

No implementation slice may proceed if it requires a new schema migration, Production DML, a secret or provider, an authentication or RBAC bypass, test data, or a destructive database operation. Such a slice must be recorded as `BLOCKED — SCHEMA_CHANGE_REQUIRED`, `REQUIRES CONFIGURATION`, or `NOT TESTED` as appropriate.

No migration will be executed in Phase 17.7. Production records will not be created or changed. Vercel environment variables and deployment configuration will not be changed by this phase.

## Planned Deliverables

The planned in-scope deliverables are portability artifacts, deployment and backup documentation, an objective launch-readiness checklist, a completion report, safe health/runbook guidance, and only narrowly scoped code fixes discovered by the launch audit. Android work is limited to a maintainable foundation and explicit verification boundaries; it is not a native feature rewrite or store release.

## Audit Conclusion

The project is suitable for a controlled Release Preparation Sprint. The most material gaps are handoff documentation, environment classification, container artifacts, and an honest Android boundary. The existing authentication, RBAC, database, storage abstraction, publication lifecycle, migration registry, and current Vercel deployment are retained as protected foundations.
## Implementation finding: standalone runtime

A local test of the first standalone-image approach failed before serving requests because the generated pnpm dependency layout could not resolve an `@swc/helpers` module from `.next/standalone`. The approach was not claimed as working. The configuration was reverted to the normal Next.js production server, and the Dockerfile now copies the built `.next`, `public`, `node_modules`, migration files, scripts, and shared runner source and starts with `pnpm start`. A clean local build and the normal production server then served `/api/health` successfully with `{"status":"ok","service":"a3lam"}`. Docker image execution remains untested because the Docker CLI is unavailable in the sandbox.
