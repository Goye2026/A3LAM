# Phase 15.2 — Homepage Blocker Diagnosis

## Root Cause

The Homepage server component at `app/page.tsx` awaits `Promise.all([personService.listCategories(), personService.listPublishedPeople()])` before it can render the Hero, CTA, search, categories, or footer. The current `try/catch` only handles rejected promises. It has no deadline for a promise that remains pending.

The unique Homepage dependency is `personService.listPublishedPeople()` at `lib/services/personService.ts`, which delegates to `databaseRepository.listPublishedPeople()` at `lib/data/databaseRepository.ts`. That repository selects all published people and hydrates every person with several related database queries, including per-timeline and per-education source queries. The database client at `lib/db/client.ts` creates a postgres.js client without a request-level query timeout.

When this server-side data promise remains pending, Next.js serves the route-level `app/loading.tsx` indefinitely. The existing fallback in `app/page.tsx` is therefore unreachable because no rejection occurs. This explains the Production observation: the Homepage remained at `جارٍ البحث في السجلات المنشورة...`, while `/categories`, `/search`, `/register`, and `/login` could reach final states because they do not await the Homepage's full published-people hydration path during initial render.

## Minimal Safe Fix

Add a bounded timeout around the Homepage's initial combined catalog read. A timeout is converted into the existing safe `dataUnavailable` state, allowing the page to render the Hero, CTA, search shell, and safe error/empty states. No data, schema, authentication, privacy, storage, or sitemap behavior is changed. The underlying repository remains the single data source; no mock data is introduced.
