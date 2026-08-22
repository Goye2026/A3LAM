# A3LAM — Phase 05 Production Data Foundation

A3LAM (أعلام) is an Arabic-first biographical knowledge platform. The approved Phase 03 editorial interface remains the public presentation layer, while Phase 04 domain contracts and Phase 05 add a persistent, source-aware data foundation underneath it.

## Current phase

The repository is currently at **Phase 05 — Production Data Foundation**. Phase 02, Phase 03, and Phase 04 commits remain in history and were not rewritten. **Phase 06 has not started.**

## Locked toolchain

| Component | Version |
|---|---:|
| Next.js | `16.3.1` |
| React | `19.2.8` |
| TypeScript | `6.0.2` |
| Node.js | `22.13.0` |
| pnpm | `11.21.0` |
| ESLint | `9.39.5` |

The lockfile is authoritative. Local development and CI use `pnpm install --frozen-lockfile`.

## Database technology

Phase 05 uses **PostgreSQL 16+ with Drizzle ORM and postgres.js**. PostgreSQL provides mature relational constraints, foreign keys, transactions, indexes, and a deployment-friendly path. Drizzle provides typed schema and query construction without introducing a second ORM, while postgres.js is the single database driver.

The server-only database client lives in `lib/db/client.ts`. It reads `DATABASE_URL` and `DATABASE_MAX_CONNECTIONS` from the environment. No database credential or secret is committed to the repository.

## Schema and domain mapping

The domain contracts remain in `lib/domain/a3lam.ts`. The typed Drizzle schema in `lib/db/schema.ts` maps them to normalized PostgreSQL tables:

| Domain concept | PostgreSQL tables |
|---|---|
| Person | `people` |
| Category | `categories` |
| Person ↔ Category | `person_categories` |
| Occupation | `person_occupations` |
| Source provenance | `sources`, `person_sources` |
| Timeline | `timeline_events`, `timeline_event_sources` |
| Education | `education`, `education_sources` |

Person and category slugs are unique. Lifecycle statuses use database `CHECK` constraints and preserve `draft`, `review`, `published`, and `archived`. Foreign keys protect relationship integrity, while indexes support status, slug, normalized search fields, occupation, timeline, and education lookups.

## Migration strategy

Migration files live in `drizzle/migrations`. `scripts/db-migrate.mjs` creates `schema_migrations`, applies sorted SQL files exactly once, and wraps each migration in a transaction. The database can therefore be recreated from a clean PostgreSQL database using the migration directory without manual SQL steps.

## Local database setup

Copy `.env.example` to `.env.local` and set a PostgreSQL connection string. The committed example uses a local development database only:

```bash
cp .env.example .env.local
pnpm db:migrate
```

The current sandbox validation used PostgreSQL 16.15 at `127.0.0.1:5432`. A deployment environment must provide its own secret `DATABASE_URL`; credentials must never be committed.

## Development seed

`pnpm db:seed` is deliberately protected by `A3LAM_ALLOW_SYNTHETIC_SEED=true`. It inserts only unmistakably synthetic development records covering `draft`, `review`, `published`, and `archived`, plus one synthetic source, timeline event, and education record for the published fixture. The records are not real people, historical figures, or production content.

The seed is idempotent for the fixture identifiers and must not be used as a production content import. Public queries still require the person, related categories, and related sources to be published, with at least one source reference.

## Repository and service architecture

The dependency direction is:

```text
Next.js UI / route / API
            ↓
     personService
            ↓
   PersonRepository
            ↓
 databaseRepository
            ↓
 PostgreSQL via Drizzle/postgres.js
```

`lib/data/databaseRepository.ts` replaces the Phase 04 in-memory public data path. It hydrates normalized rows into the existing `PersonRecord` shape, implements create/read/update operations, validates records before insertion or publication, and keeps SQL/database access outside React components. `lib/data/localRepository.ts` remains only as a lightweight Phase 04 contract test fixture; it is no longer the production service source.

## Publication security

The public service exposes only records with `status = 'published'`. It additionally validates the hydrated record so unpublished categories or sources, missing source references, invalid relationships, and malformed records are rejected. The profile route `/person/[slug]` uses the published lookup and sends draft, review, archived, and unknown slugs to the not-found boundary. The search API returns a deliberately limited public response and never includes biography, source, or unpublished metadata.

## Search behavior

Search remains replaceable through `lib/domain/search.ts`, but Phase 05 executes it against PostgreSQL-backed data. It supports Arabic normalization, exact and partial name matching, slug matching, category filtering, occupation filtering, no-match behavior, and published-only filtering. Search requests are handled by `app/api/search/route.ts`; the client discovery component calls that route instead of importing server database code.

## Routes and UI scope

The Phase 03 visual system is preserved. Phase 05 makes only the integration changes needed to load categories and published people asynchronously and to expose persistent search and profile data. The public routes remain `/`, `/api/health`, `/api/search`, and `/person/[slug]`. No admin dashboard, CMS, authentication, user accounts, comments, payments, analytics, or editorial UI is included.

## Testing commands

Unit and foundation tests do not require a database:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

The integration suite uses a real PostgreSQL instance and requires `DATABASE_URL`:

```bash
DATABASE_URL=postgres://a3lam:a3lam@127.0.0.1:5432/a3lam pnpm test:integration
```

That command runs migrations, applies the explicitly enabled synthetic seed, and executes persistence, relationships, lifecycle, publication security, profile lookup, and database-backed search tests. The full build gate is:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Real-content policy

No real biographical claims, historical personalities, contact details, or invented sources are included. Future production content requires explicit source provenance and editorial review. AI output is not treated as a source and cannot publish factual content automatically.
