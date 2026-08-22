# A3LAM — Phase 05 Production Data Foundation

**Status:** Phase 05 implementation record

**Baseline:** `d31510b1b7802b1b54942680f82a4c08d2d894e6`

**Phase 06:** Not started

## Scope

Phase 05 replaces the Phase 04 in-memory production path with a persistent PostgreSQL data layer. The approved Phase 03 visual interface and Phase 04 domain contracts remain intact. This phase does not introduce authentication, users, roles, admin UI, CMS features, comments, payments, analytics, or editorial dashboards.

## Technology decision

The implementation uses PostgreSQL 16+ with Drizzle ORM and postgres.js. PostgreSQL is a mature relational database with foreign keys, transactions, check constraints, and indexes suitable for a structured biographical knowledge platform. Drizzle provides typed schema and query construction. postgres.js is the only database driver. No second ORM or search engine was introduced.

The sandbox did not initially have PostgreSQL or Docker. PostgreSQL 16.15 was installed locally for genuine integration verification. Deployment still requires an externally managed PostgreSQL-compatible service and a server-only `DATABASE_URL`.

## Schema mapping

| Domain entity | Persistent representation |
|---|---|
| `Person` | `people` |
| `Category` | `categories` |
| Person/category many-to-many | `person_categories` |
| Person occupations | `person_occupations` |
| `Source` | `sources` and `person_sources` |
| `TimelineEvent` | `timeline_events` and `timeline_event_sources` |
| `Education` | `education` and `education_sources` |

People and categories use unique slugs. All lifecycle statuses are constrained to `draft`, `review`, `published`, and `archived`. Sources store title, publisher, URL, optional publication date, access date, source type, reliability, status, and timestamps. Search fields are stored in normalized form to support Arabic matching without an external index.

## Migration mechanism

The migration directory is `drizzle/migrations`. `scripts/db-migrate.mjs` creates a `schema_migrations` table, reads migration files in lexical order, applies each unapplied file in a transaction, and records its version. The reproducible setup commands are:

```bash
cp .env.example .env.local
pnpm db:migrate
```

No manual SQL step is required after the migration command.

## Environment variables

`.env.example` documents the required server-side variables:

```text
DATABASE_URL=postgres://a3lam:a3lam@localhost:5432/a3lam
DATABASE_MAX_CONNECTIONS=5
```

The example values are local development placeholders. Real credentials must be supplied through `.env.local` or deployment secret storage and must never be committed or bundled into client code.

## Seed policy

`scripts/db-seed.mjs` is protected by `A3LAM_ALLOW_SYNTHETIC_SEED=true`. It inserts the minimum synthetic fixture set required by the phase: one draft, one review, one published test record, one archived record, seven categories, one synthetic source, one timeline event, and one education record. Every fixture is explicitly synthetic and is not a real person or historical biography.

The seed is intentionally not automatic. The development command is:

```bash
A3LAM_ALLOW_SYNTHETIC_SEED=true pnpm db:seed
```

The published fixture is only for development verification and must not be treated as production content.

## Repository architecture

The application follows:

```text
UI / Next.js route / public API
                ↓
          personService
                ↓
         PersonRepository
                ↓
       databaseRepository
                ↓
     Drizzle + postgres.js
                ↓
           PostgreSQL
```

`databaseRepository` hydrates normalized rows into the Phase 04 `PersonRecord` contract. It supports asynchronous category and person reads, public published lookup, database-backed search, create, and update operations. The local repository remains only for the existing contract tests and is no longer used by production service code.

## Publication security

The public read path always applies `status = 'published'`. A hydrated record must also pass `validatePublishedRecord`, which requires published categories, published sources, valid relationships, and at least one person-to-source reference. Draft, review, archived, malformed, and unknown records do not resolve through the public profile service.

The `/person/[slug]` route calls the service layer and uses the not-found boundary for unavailable records. `/api/search` returns only a bounded, public projection of published records; it does not return biography, source records, or unpublished metadata. The client search component calls the API route and never imports the server database client.

## Search behavior

The existing Phase 04 normalization and matching contract is preserved. The database repository supports Arabic-normalized exact and partial name matching, slug matching, category filtering, occupation filtering, no-match responses, and published-only filtering. The abstraction remains replaceable by a future advanced search index without moving database calls into React components.

## Tests and verification

The standard checks are:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The integration command uses a real PostgreSQL instance:

```bash
DATABASE_URL=postgres://a3lam:a3lam@127.0.0.1:5432/a3lam pnpm test:integration
```

Integration tests verify migration/seed readiness, category persistence, person read/write/update lifecycle, source relationships, timeline, education, publication security, public profile lookup, Arabic exact/partial/slug search, category and occupation filtering, no-match behavior, and exclusion of draft/review/archived records.

## UI preservation

The Phase 03 visual implementation is preserved. Phase 05 changes only integration points: homepage data is loaded asynchronously from the service, categories and published records originate from PostgreSQL, search uses `/api/search`, and the profile route uses the published service lookup. No visual redesign was introduced.

## Explicit non-scope

Phase 06 is not started. There is no authentication, public registration, user account, role UI, admin dashboard, CMS, comments, social feature, payments, analytics, AI publishing, real biography import, or external search engine in this phase.
