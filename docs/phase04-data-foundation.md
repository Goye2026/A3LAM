# A3LAM — Phase 04 Data Foundation Decision Record

**Status:** Implemented on top of Phase 03

**Parent commit:** `7bfdc487f405ce19cd1ade0f58e752357946bf66`

**Phase 05:** Not started

## Decision summary

Phase 04 introduces the structured data boundary required for a biographical encyclopedia without changing the approved Phase 03 editorial interface. The implementation uses typed domain records, deterministic validation, a repository contract, a service layer, and a small local in-memory adapter.

## Domain model

The core `Person` record owns stable identity and public profile fields: `id`, `slug`, `name`, `nameArabic`, `shortBio`, `biography`, optional birth/death dates and places, category relationships, occupations, optional image, lifecycle status, record timestamps, and relationship IDs for timeline, education, and sources.

`Category` is a normalized record with a stable ID, slug, label, description, and status. `TimelineEvent` and `Education` are separate related records keyed by `personId`. `Source` is a first-class record containing title, publisher, URL, access date, source type, reliability classification, and status. `PersonRecord` composes these normalized records for read operations.

## Content lifecycle

The supported lifecycle is:

```text
draft → review → published → archived
```

A record may remain in `draft` or `review` while editorial work is incomplete. `archived` preserves a record without making it public. The public repository returns only `published` people. A published record must have published related categories, published sources, valid relationships, and at least one source reference.

## Validation

`lib/domain/a3lam.ts` validates required names, slug format, status values, ISO calendar dates, date ordering, category membership, source URLs, source access dates, source references, and ownership of timeline/education records. `validatePublishedRecord` applies the additional publication gate. Validation issues are structured with field paths so a later editor can provide actionable feedback.

## Storage decision

No database dependency is introduced in Phase 04. The current project has no approved production database configuration, authentication, editorial workflow, or real-person content set. An in-memory `localRepository` is therefore the smallest runnable adapter that proves the domain and service boundaries without pretending that persistence exists.

The repository contract is intentionally replaceable. A later relational adapter can implement the same methods and add migrations when the project authorizes persistence, editorial roles, and a production content workflow. No paid service is required for the current phase.

## Service and repository boundary

The intended dependency direction is:

```text
UI / Next.js route
        ↓
personService
        ↓
PersonRepository
        ↓
localRepository
```

React components do not define domain records and do not perform storage queries. `SearchDiscovery` calls the service boundary, and `/person/[slug]` calls the public published lookup through the service.

## Search architecture

`lib/domain/search.ts` implements a deterministic local search that can later be replaced by a dedicated index. It supports Arabic normalization, diacritic removal, common letter normalization, exact name matching, partial name matching, slug matching, category filtering, and occupation filtering. The public repository passes only published people to this function. Empty queries return an empty result rather than the complete dataset.

The existing Phase 03 search visual surface is preserved. It now exposes idle, loading, success, empty, and error states. The current local records are not published, so a search does not expose demo content as public encyclopedia content.

## Category and profile behavior

Categories are sourced from `localRepository` and adapted for the existing visual category cards. The profile route uses `getPublishedPersonBySlug`. Draft, review, archived, and nonexistent slugs are all rejected at the public data boundary and flow to the existing not-found page. The profile presentation markup remains available for future published records.

## Data integrity boundary

The local records are generic display samples only. They contain no real biographies, historical claims, sources, contact details, or factual achievements. The application does not scrape websites, bulk-import Wikipedia, copy copyrighted biographies, or publish AI-generated facts.
