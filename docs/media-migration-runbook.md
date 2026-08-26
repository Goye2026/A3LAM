# Media Migration Runbook — `0007_phase17_16_media_architecture.sql`

## Scope

Migration 0007 is additive and creates `media_assets`, `person_media`, indexes, and constraints. It stores metadata and references only; it does not insert seed rows, upload objects, alter existing People, or modify `profile_files`.

## Repository preparation

The migration filename must be present in `lib/db/migrations/manifest.mjs` after the existing 0001–0006 sequence. Confirm that the SQL file and manifest are committed together. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `git diff --check`. Do not run `pnpm test:integration` when it invokes migrations or synthetic seed.

## Local application

Only a separately provisioned local PostgreSQL database may be used. Confirm the database target is local before running:

```bash
pnpm db:migrate
```

Then inspect `schema_migrations` and confirm `0007_phase17_16_media_architecture.sql` is applied exactly once, and verify the two new tables and indexes. Do not use this command when `DATABASE_URL` points to an existing shared or Production database.

## Production gate

Phase 17.16 does **not** apply 0007 to Production. After deployment, the migration registry is expected to show 0007 as `PENDING` until the deployment owner separately authorizes a controlled migration operation. The application must remain backward-compatible while it is pending: public People continue using the safe legacy `image_url`, and Admin Media displays a migration-required state.

A future Production operator must independently verify database target, backup readiness, registry consistency, prerequisite 0001–0006 state, SQL review, and rollback/incident plan before running the existing guarded migration runner. No direct SQL, automatic build hook, temporary endpoint, or Production upload may be used as a substitute.

## Post-application verification

After explicit approval and execution, verify `schema_migrations`, table definitions, constraints, indexes, registry consistency, `/api/health`, Admin authorization, Media API anonymous protection, and public privacy projection. Populate no media records as part of migration verification.
