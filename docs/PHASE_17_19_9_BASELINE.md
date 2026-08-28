# PHASE 17.19.9 — FUNCTIONAL REALITY BASELINE

**Date:** 2026-08-28  
**Repository:** `/home/ubuntu/a3lam-phase13-restored`  
**HEAD at baseline:** `6dc0890fe29d421056d7c552c1e5088a42399e4f`  
**Environment:** Node.js 22.13.0، pnpm 11.21.0، Next.js App Router / React / TypeScript / Drizzle.  
**Safety state:** read-only audit؛ لا Production DB access، لا migrations، لا seed، لا writes، لا uploads، لا AI/provider calls.

## A. Current public routes

| Route | Baseline observation |
|---|---|
| `/` | HTTP 200؛ homepage renders hero and shared shell, but catalog metrics are `—` and featured/categories show `تعذر الوصول إلى الكتالوج المنشور الآن.`؛ لا person cards ظاهرة في HTML المستخرج. |
| `/categories` | HTTP 200؛ public category route reachable، والحالة المرئية/البيانات الفعلية تعتمد على repository. |
| `/search` | HTTP 200؛ search shell reachable، client UI موجود، والنتائج تعتمد على `/api/search`. |
| `/about` | HTTP 200؛ InfoPage يمر عبر `SiteFrame` بعد Phase 17.19.8. |
| `/person/ibn-khaldun` | HTTP 200 transport-wise، لكن الصفحة rendered error state ونتيجتها تتضمن `500 / أعلام` و`تعذر الوصول إلى الكتالوج المنشور الآن.`؛ لم يُعرض السجل العام في anonymous check. |
| `/admin` | HTTP 307 بدون session عند الفحص الحالي؛ protected. |
| `/admin/ai` | HTTP 307 بدون session عند الفحص الحالي؛ protected. |
| `/admin/content/pages` | HTTP 307 بدون session عند الفحص الحالي؛ protected. |
| `/admin/content/posts` | HTTP 307 بدون session عند الفحص الحالي؛ protected. |

Evidence: `/home/ubuntu/phase17199_baseline_routes.txt`، `/home/ubuntu/phase17199_public_baseline.txt`، `/home/ubuntu/phase17199_browser_findings.md`.

## B. Current implementation map

| Feature | Real route | Real data source | UI exists | Functional | Production reachable | Evidence |
|---|---|---|---|---|---|---|
| Homepage | `app/page.tsx` | `personService.listCategories()` + `personService.listPublishedPeople()` + `siteExperienceRepository.getPublishedResource("homepage")` | Yes | **PARTIAL / UNAVAILABLE at runtime**؛ rendered error state with no people | Yes, HTTP 200 | `app/page.tsx:108-151, 201-266`; anonymous `/` output |
| Person listing | homepage featured section / `/search` | `databaseRepository.listPublishedPeople()` or `/api/search` | Yes | **NOT OBSERVABLE publicly**؛ homepage catalog unavailable | Yes | `lib/services/personService.ts:18-20`; `lib/data/databaseRepository.ts:256-261` |
| Person route | `/person/[slug]` | Profile repository first, then `personService.getPublishedPersonBySlug()` | Yes | **PARTIAL / ERROR observed** for `ibn-khaldun` | Yes | `app/person/[slug]/page.tsx:29-37, 52-68`; anonymous route output |
| Categories | `/categories`, `/categories/[slug]` | `personService.listCategories()` and category-scoped published queries | Yes | **REACHABLE; runtime data not proven in this audit** | Yes | `app/categories/page.tsx`; `app/categories/[slug]/page.tsx`; HTTP 200 |
| CMS Dashboard | `/admin` | `adminRepository` metrics and recent people | Yes | **AUTHENTICATED NOT TESTED**; anonymous gate works | Gate reachable only | `app/admin/(protected)/page.tsx`; HTTP 307 |
| Pages | `/admin/content/pages` and APIs | `editorialRepository` / CMS tables | Yes | **Capability contract exists; persistence status requires runtime/admin evidence** | Gate reachable only | `app/admin/(protected)/content/pages/page.tsx`; `app/api/admin/cms/pages/route.ts` |
| Posts | `/admin/content/posts` and APIs | `editorialRepository` / CMS tables | Yes | **Capability contract exists; persistence status requires runtime/admin evidence** | Gate reachable only | `app/admin/(protected)/content/posts/page.tsx`; `app/api/admin/cms/posts/route.ts` |
| Categories management | `/admin/categories` and APIs | `adminRepository` / `categories` table | Yes | **Authenticated not tested**; server-side route/API exists | Gate reachable only | `app/admin/(protected)/categories/page.tsx`; `app/api/admin/categories/route.ts` |
| Media | `/admin/media` and picker API | `lib/media/repository.ts` / media tables | Yes | **Authenticated not tested**; picker is read-only/eligible projection | Gate reachable only | `components/a3lam/CmsMediaPicker.tsx`; `app/api/admin/media/picker/route.ts` |
| Biography Editor | `/admin/people/new`, `/admin/people/[id]` | `adminRepository` over Person domain | Yes | **Authenticated not tested**; local recovery is not server persistence | Gate reachable only | `components/a3lam/AdminPersonForm.tsx`; protected person routes |
| Appearance | `/admin/site`, `/admin/appearance` | `siteExperienceRepository` / `site_experience_configs` | Yes | **Public runtime consumes published homepage config; authenticated editing not tested** | Gate reachable only | `lib/site-experience/repository.ts`; `app/page.tsx:204-205` |
| AI | `/admin/ai` | AI modules and explicit flags | Yes | **FORBIDDEN / DISABLED** for Production activation/publication | Protected gate only | `AI_PRODUCTION_ENABLED=false`; `/admin/ai` 307 |

No `PASS` label above is used without direct evidence. Database row counts are **NOT OBSERVABLE** because Production database access is forbidden and no isolated database was authorized.

## C. Homepage data pipeline

The source-defined pipeline is:

```text
PostgreSQL DATABASE_URL
  → lib/db/client.ts getDb()
  → lib/data/databaseRepository.ts
       listCategories()
       listPublishedPeople()
  → lib/services/personService.ts
       listCategories()
       listPublishedPeople()
  → app/page.tsx HomepageCatalogSections
  → toDisplayCategories(categories)
  → toDisplayPeople(people, categories)
  → CategoryCard / PersonCard
  → rendered homepage HTML
```

The homepage also loads presentation configuration through:

```text
siteExperienceRepository.getPublishedResource("homepage")
  → HomepageSettings
  → SiteFrame(template="index") + visible sections / limits / copy
```

`app/page.tsx` uses a 5-second timeout around the categories/people `Promise.all`; any thrown error or timeout sets `dataUnavailable = true`, after which the view renders `—` metrics and `تعذر الوصول إلى الكتالوج المنشور الآن.`. This is the exact source behavior observed in Production. It is not evidence that the database is empty.

## D. Person pipeline

The editorial person pipeline is:

```text
people row
  → databaseRepository.listPublishedPeople()
  → hydratePerson()
  → validatePublishedRecord(record)
  → record.person
  → personService.listPublishedPeople()
  → app/page.tsx
  → toDisplayPeople()
  → PersonCard
  → /person/[slug]
```

The public slug pipeline is:

```text
/person/[slug]
  → getUnlistedOrPublishedProfileBySlug(slug)
  → if no profile: personService.getPublishedPersonBySlug(slug)
  → getPersonBySlug(..., publishedOnly=true)
  → hydratePerson()
  → validatePublishedRecord(record)
  → public Person page or notFound/error boundary
```

The public validation gate requires more than `people.status = 'published'`: the hydrated record must satisfy the domain publication rules, including published categories, published sources, at least one source reference, and consistent related references. This gate is implemented in `databaseRepository.ts` and the domain validator. It is a candidate functional boundary, not yet proven to be the production root cause without safe runtime/database evidence.

## E. Schema reality

The relational schema contains separate tables for `categories`, `people`, `person_categories`, `person_occupations`, `sources`, `person_sources`, `timeline_events`, `timeline_event_sources`, and `education`/`education_sources`. Professional `profiles` and related profile tables are separate from editorial `people`. `site_experience_configs` stores site-experience resources. CMS content tables are represented by the Phase 17.19.3 migration, which remains **CREATED / NOT APPLIED** according to the Phase 17.19.8 record; this audit did not apply or inspect Production database state.

## F. Reality audit conclusion before fixes

The functional regression is confirmed at the public boundary: the homepage is a shell with a truthful but degraded unavailable catalog state, and `/person/ibn-khaldun` does not render the known person in the anonymous Production check. Source inspection confirms the homepage is wired to the real PostgreSQL repository rather than the in-memory sample repository. The exact failure class remains **runtime data access or repository/publication validation failure not yet isolated**, because Production database credentials and mutation/diagnostic access are forbidden. No code was changed before this baseline was written.
