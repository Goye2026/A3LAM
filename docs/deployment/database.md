# PostgreSQL Operations

## Supported flow

A new private deployment requires PostgreSQL, a database, a least-privilege application user, and a protected `DATABASE_URL`. Configure network access so PostgreSQL is reachable by the application but is not publicly exposed.

```text
install PostgreSQL
→ create database and owner
→ configure DATABASE_URL
→ pnpm install --frozen-lockfile
→ pnpm db:migrate
→ pnpm build
→ pnpm start
```

The existing `scripts/db-migrate.mjs` and shared migration runner are the only supported migration path. The runner applies ordered SQL files transactionally and records them in `schema_migrations`. Do not write ad-hoc SQL execution into startup, Docker healthchecks, or deployment hooks.

## Production safety

The current final launch freeze does not execute migrations and does not change the existing Production database. For a future new private database, inspect the target and backup plan before running `pnpm db:migrate`. Never run `pnpm db:seed` in Production; the synthetic seed is development-only.

## Connection and pooling

Keep `DATABASE_URL` server-only and use the configured connection limit appropriate to the host and PostgreSQL service. Account for all application replicas when setting PostgreSQL connection capacity. Do not log connection strings, query parameters containing credentials, or database error details in public responses.

## Verification

Use `/api/health` for the application probe and the database provider's native readiness tools for PostgreSQL. A successful application health response does not replace database backup verification. Use the Admin System page for the existing safe database/schema status projection; it does not expose connection details or arbitrary SQL.
