# A3LAM — PHASE 17.19.13 HOMEPAGE DEPENDENCY AUDIT

## End-to-end path

```text
/ → app/page.tsx
  → siteExperienceRepository.getPublishedResource("homepage")
  → personService.listCategories()
  → databaseRepository.listCategories()
  → categories WHERE status = published

/ → personService.listPublishedPeople()
  → databaseRepository.listPublishedPeople()
  → people WHERE status = published
  → hydratePerson()
  → category / occupation / source / timeline / education relations
  → getPublicPortraitUrl()
  → person_media JOIN media_assets
  → validatePublishedRecord()
  → toDisplayPeople()
  → PersonCard
```

## Required relations

| Relation | Runtime use | Failure implication |
|---|---|---|
| `categories` | category index and category hydration | categories unavailable or incomplete |
| `people` | published people selection | no Person candidates |
| `person_categories` | person/category joins | record hydration/public validation issue |
| `person_occupations` | occupation hydration | structured record may be incomplete |
| `sources` | source objects | publication validation/source section issue |
| `person_sources` | person-source relation | source completeness issue |
| `timeline_events` / `timeline_event_sources` | timeline hydration | structured biography relation issue |
| `education` / `education_sources` | education hydration | structured biography relation issue |
| `media_assets` / `person_media` | safe portrait lookup | media query failure or no image |
| site-experience persistence | homepage sections/copy | default configuration fallback |

## Why cards are absent

The evidence does not prove that Production database is empty. The current homepage reads the real database-backed repository and wraps the catalog query in a bounded timeout. When the catalog promise rejects, the page marks `dataUnavailable = true` and renders an alert/empty state with `—` metrics. It does not fabricate people or fall back to `localRepository`.

The observed PostgreSQL `42P01` for `person_media` proves that at least one public runtime dependency is missing in the observed environment. It does not prove that this is the only missing relation or that all other relations/data are healthy. The evidence-based classification is therefore:

> Person cards are absent because the database-backed catalog pipeline is not completing successfully in the observed runtime; the complete Production schema and data state are not observable through an authorized database channel.

It is invalid to state that cards are absent because the database is empty unless Production data has actually been observed through an authorized read-only channel.

## Publication and privacy boundaries

`listCategories()` filters to `published` categories. `listPublishedPeople()` filters people to `published`, hydrates the full record, and removes records that fail `validatePublishedRecord()`. Portrait selection requires a primary `portrait` association, `media_assets.status = ready`, `media_assets.visibility = public`, and `getSafePublicImageUrl()`. The UI receives a public `Person` projection, not a raw row.

## Restoration acceptance

Homepage restoration requires directly observed success for categories, published people, nested record hydration, media eligibility or safe no-image behavior, publication validation, PersonCard rendering, private-field exclusion, and responsive RTL rendering. HTTP 200 alone, a successful build, or a READY deployment is insufficient.

If schema is healthy and no published records exist, the correct result is an observed empty state. Until row state is observable, use `NOT_OBSERVABLE`, not zero.

## Current status

`HOMEPAGE_STATUS = DEGRADED / NOT VERIFIED AS RESTORED`.

No hardcoded Person cards, mock data, local repository fallback, schema bypass, or unrelated UI redesign was introduced.
