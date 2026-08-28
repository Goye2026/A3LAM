# A3LAM — PHASE 17.19.13 RECOVERY PLAN

## Current gate

```text
PRODUCTION_RECOVERY = BLOCKED
PRODUCTION_RECOVERY_AUTHORIZATION = NOT_VERIFIED_AS_SEPARATE_DDL_GATE
```

هذه وثيقة خطة وليست تفويضًا أو تنفيذًا. لا تبدأ Production DDL إلا بعد اجتياز جميع البوابات أدناه.

## Mandatory gates

| Gate | Required evidence | Current state |
|---|---|---|
| `EXPLICIT_AUTHORIZATION` | current explicit approval for Production schema recovery | NOT_VERIFIED |
| `PRODUCTION_PG_CHANNEL` | legitimate target channel with safe read/write controls | NOT_AVAILABLE |
| `BACKUP_STATUS` | provider snapshot ID, timestamp, restore path, retention/restore proof | NOT_CONFIRMED |
| `MIGRATION_ORDER` | manifest and Production history agree | SOURCE VERIFIED / PRODUCTION NOT_OBSERVABLE |
| `ISOLATED_REHEARSAL` | full ordered chain passes on isolated PostgreSQL | NOT_AVAILABLE |
| `SCHEMA_COMPATIBILITY` | metadata and data checks pass | NOT_OBSERVABLE |
| `ROLLBACK_PLAN` | tested or provider-confirmed recovery method | PLAN_ONLY |
| `DESTRUCTIVE_CHANGES` | no unapproved constraint/data risk | NOT_CONFIRMED |

If any gate is false, unknown, or unavailable, stop with `PRODUCTION_RECOVERY = BLOCKED`.

## Safe sequence

1. Confirm the target database without exposing credentials.
2. Obtain a recoverable provider-native snapshot and record non-sensitive identifier/timestamp/restore path.
3. Create an isolated non-production PostgreSQL clone; never use Production for rehearsal.
4. Inspect clone `information_schema`, `pg_catalog`, and `schema_migrations` read-only.
5. Apply the canonical manifest in order using the native runner only; stop at the first failure.
6. Run deterministic `TEST_*` fixture checks for PK/FK/unique/nullability/index/status compatibility and public projections.
7. Run application/integration validation only against the isolated database.
8. Perform a rollback/restore rehearsal and retain evidence.
9. Request/record separate explicit Production authorization.
10. On Production, apply only the proven necessary ordered migrations through the native runner. Do not skip, reset, drop, truncate, seed, or rewrite migration history.
11. Verify schema after each migration and stop on any error.
12. Run bounded GET/HEAD smoke and functional Homepage/Person/CMS checks only after schema verification.

## Likely runtime dependency

`person_media` is the observed missing relation and is defined in migration 0007 alongside `media_assets`. It is not safe to create the table manually or apply 0007 blind because the Production migration history and earlier prerequisites are not observable. Later CMS/media dependencies must also be checked.

## Rollback

`ROLLBACK_PLAN = PLAN_ONLY`. If a migration fails, stop the runner and preserve the failure state. Do not manually edit `schema_migrations` or apply reverse SQL by guesswork. Restore to an approved snapshot/clone through the provider recovery procedure, verify metadata and runtime, and record expected downtime if applicable. If restore is impossible, Production recovery remains blocked.

## Prohibited actions

Never run `drizzle-kit push`, database reset, schema reset, `DROP DATABASE`, `DROP SCHEMA`, `DROP TABLE`, `TRUNCATE`, `DELETE`, or manual migration-history manipulation. Never seed or populate Production, create People/Profiles/Users, upload media, enable AI, invoke providers/OCR, change secrets/DNS/Vercel configuration, or bypass authentication/RBAC.

> DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION
