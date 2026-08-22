# A3LAM — Phase 04 Data Foundation

A3LAM (أعلام) is an Arabic-first biographical knowledge platform. The approved Phase 03 editorial interface remains the public presentation layer, while Phase 04 adds a structured domain and content boundary underneath it.

## Current phase

The repository is currently at **Phase 04 — Data Foundation & Real Content Architecture**. Phase 02 and Phase 03 commits remain in history and were not rewritten. **Phase 05 has not started.**

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

## Domain model

The normalized domain types live in `lib/domain/a3lam.ts`. The core entities are `Person`, `Category`, `Source`, `TimelineEvent`, and `Education`. A `PersonRecord` composes one person with its related categories, timeline events, education records, and sources without placing all information into one large object or UI component.

Every person and category has an explicit `ContentStatus`: `draft`, `review`, `published`, or `archived`. A public profile is eligible only when the person, related categories, and related sources are published and the person has at least one source reference. Draft, review, archived, and nonexistent slugs are rejected by the public profile lookup and resolve through the existing not-found boundary.

Validation is deterministic and lives alongside the domain types. It checks required names, slug format, ISO dates, status values, category relationships, source URLs and dates, source references, and person ownership of timeline and education records. Invalid records do not silently become published content.

## Data lifecycle and boundary

The current Phase 04 storage implementation is a deliberately small in-memory local repository in `lib/data/localRepository.ts`. It is appropriate for the current repository because there is no production database, no authenticated editorial workflow, and no approved real-person dataset yet. It keeps the application runnable locally without introducing a database dependency or an external paid service.

The repository is accessed through `lib/services/personService.ts`, which provides the service boundary consumed by routes and interactive UI. The intended direction is:

```text
Next.js UI / route
        ↓
personService
        ↓
PersonRepository
        ↓
localRepository (current local storage)
```

The repository can later be replaced by a relational database adapter and migrations without moving data access into React components. No migration or production seed data is included in this phase.

## Real-content boundary

The initial local records are explicitly identified display samples. They use generic sample labels, carry non-published statuses, have no factual biographies, and have no sources or contact information. They are never returned by public published queries. The project does not scrape, bulk-import, copy, or publish biographies from external websites.

Published factual content requires source references. The `Source` model records title, publisher, URL, access date, type, reliability, and content status so later editorial workflows can trace claims without treating AI output as evidence.

## Search architecture

`lib/domain/search.ts` provides a lightweight, deterministic search abstraction that can later be replaced by a dedicated index. It supports Arabic normalization, diacritic removal, common Arabic letter normalization, exact name matching, partial name matching, slug matching, category filtering, and occupation filtering. The public repository searches published people only.

`SearchDiscovery` keeps the approved Phase 03 visual surface and now calls `personService`. It exposes explicit idle, loading, success, empty, and error states with accessible live feedback. The current local dataset has no published people, so searches correctly return the no-results state rather than exposing demo records.

## Categories and profile route

Categories are defined in the repository and adapted for the existing visual cards through `lib/a3lam/catalog.ts`; they are not owned solely by presentation components. The `/person/[slug]` route calls the service layer and renders only a published `PersonRecord`. The approved profile visual structure is preserved for future published records, while non-published and nonexistent slugs are not exposed.

## Repository structure

```text
app/                         App Router pages, route boundary, global styles
components/a3lam/           Approved A3LAM UI components and search surface
lib/domain/                  Person/category/source types, validation, search
lib/data/                    Repository contract and local repository
lib/services/                Service boundary used by UI and routes
lib/a3lam/                   Presentation adapters backed by the service
lib/i18n/                    Arabic-first localization and fallback behavior
tests/                       Foundation and Phase 04 domain/search tests
docs/phase04-data-foundation.md  Phase 04 architecture record
```

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The required validation sequence is:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The project remains local-first and does not require a database, paid external service, authentication, admin dashboard, CMS, user accounts, payments, or analytics in Phase 04.
