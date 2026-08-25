# PHASE 17.11 — A3LAM HOMEPAGE 2.0

## Completion Status

# **PHASE 17.11 — COMPLETE WITH LIMITATIONS**

**Population = NOT STARTED**  
**Phase 18 = NOT STARTED**

This phase delivered a substantial public Homepage 2.0 and discovery-experience redesign. The work remained within the authorized UI/frontend scope. No database, authentication, authorization, privacy projection, publication lifecycle, storage, provider, secret, or Production data changes were made.

## Executive Summary

A3LAM’s homepage is now structured as an Arabic-first discovery gateway rather than a generic marketing landing page. The new composition establishes a clear flow from **discover → search → browse → deepen → contribute**, while continuing to use the existing public data readers and published-content gates.

The implementation introduces a stronger editorial hero, an independent catalog suspense boundary, a large advanced search surface, data-driven featured and category sections, an honest Discovery/Timeline foundation, a three-principle Trust section, and refined public navigation/footer styling. Where data or functionality does not exist, the UI says so rather than fabricating people, counts, periods, sources, testimonials, or submission workflows.

Local typecheck, lint, build, tests, and targeted browser checks passed. Final Production deployment verification is performed only after the implementation commit and is recorded in the final closeout evidence; the pre-change Production baseline was read-only and healthy.

## What Changed

The homepage composition in `app/page.tsx` was restructured into a fast Hero shell plus an asynchronous `HomepageCatalogSections` boundary. `HomepageTrust.tsx` and `HomepageDiscovery.tsx` are new reusable public components. The catalog mapper now exposes `indexLabel` rather than a misleading ordinal `count`, while public category links and published-person projections remain unchanged.

The central stylesheet received a Homepage 2.0 layer for the paper/ink/teal/copper visual system, responsive grids, typography hierarchy, discovery panel, editorial bands, trust principles, focusable controls, and reduced-motion behavior. The existing Site Experience configuration remains the source of editable homepage copy and visibility flags; no schema or migration was introduced.

A small regression suite was added in `tests/phase17.11.test.ts`, and the existing Phase 17.9 source-level regression was updated to follow the new CatalogStats/fallback structure rather than the previous JSX arrangement.

## Typography

The Arabic primary font choice is **Noto Sans Arabic**, selected because it is available in the local browser environment, renders Arabic headings and body copy clearly at mobile and desktop sizes, and provides a dependable system fallback without introducing a new runtime font dependency. The Latin stack remains `IBM Plex Sans`, `Noto Sans`, and Arial fallbacks.

The new scale uses responsive `clamp()` sizing for Hero and section headings, approximately 17–19px body text, compact metadata labels, and touch-sized buttons. The implementation does not claim font licensing or cross-browser certification; those require a formal asset/licensing review and external browser matrix.

## Homepage Architecture

The Hero and public shell render independently of the potentially slow catalog query. Only the catalog-driven sections are wrapped in a React `Suspense` boundary and use the existing `withTimeout` pattern. The fallback keeps the shell, stats, search, and section-level unavailable states visible instead of converting the whole page into an indefinite loader.

The data path continues to use `siteExperienceRepository.getPublishedResource("homepage")`, `personService.listPublishedPeople()`, and `personService.listCategories()`. No Admin API is called by the public homepage. Section visibility remains derived from the existing persisted homepage configuration.

## Hero

The Hero now has a stronger Arabic editorial hierarchy: eyebrow, audience context, split title treatment, supporting copy, primary/secondary actions, a trust note, and a quiet archive-style visual panel. Optional persisted `hero.imageUrl` remains decorative and is layered behind an overlay; no stock asset or new image was added.

The Hero does not await `listPublishedPeople()`. When catalog data is slow or unavailable, the Hero remains visible and the catalog sections receive their own safe fallback. The optional “create profile” action continues to use the existing configured route and was not redirected to a new mutation.

## Search

The existing `SearchDiscovery` component is now presented as a prominent dark editorial discovery panel with clearer field labels, larger controls, localized placeholders, and stronger focus/hover behavior. It continues to use the current public search API and published projection.

No autocomplete, semantic search, vector search, or fake suggestions were introduced because the current API does not provide those capabilities. Empty submissions continue to return to idle without a stuck loading state, and search results do not add email, phone, private files, or unpublished records.

## Featured People

Featured people remain fully data-driven through the current published people reader and `toDisplayPeople` mapper. The section never inserts fictional people or placeholders. When the catalog is empty or unavailable, the page shows an explicit status/alert instead of an empty carousel or fake sample cards.

A carousel was intentionally not added. There is no need to load carousel code when the public catalog may be empty, and avoiding it preserves performance and reduces interaction complexity. A future carousel remains DEFERRED until there is enough published data and an explicit keyboard/touch interaction design.

## Categories

Categories continue to come from the real public `personService.listCategories()` reader. Existing category links and descriptions remain editable through current data/configuration. The presentation ordinal is now named `indexLabel`; it is not presented as a people count. No fabricated category counts are rendered.

If categories are unavailable, the page shows the localized unavailable state. If the source returns no categories, it shows the category-specific empty state. No category records were created or modified.

## Discovery

`HomepageDiscovery.tsx` supplies a restrained, expandable visual foundation for a future timeline/knowledge journey. It explicitly states that periods and event data are not available for a truthful timeline today. The actions point only to existing `/search` and `/categories` routes.

No new taxonomy, period model, event data, schema field, migration, or historical claim was introduced. The full Timeline experience is **DEFERRED / DATA NOT AVAILABLE**.

## Trust / Why A3LAM

`HomepageTrust.tsx` adds three localized principles: sourced knowledge, Arabic-first experience, and a structured foundation that can grow. The copy avoids unsupported scale claims, user numbers, rankings, testimonials, or “largest encyclopedia” language.

## Suggest Person CTA

A new person-submission mutation or route was not created because no approved public suggestion workflow was available within this phase. The existing final CTA remains an informational `/about` path and communicates that contribution tools are governed by editorial review. A dedicated “Suggest a person” route is **DEFERRED** rather than simulated.

## Header and Footer

The public Header remains semantic and configuration-driven, with the existing session-aware account/login behavior unchanged. Homepage 2.0 improves its spacing, active-link treatment, sticky desktop presentation, small-screen wrapping, and touch-sized actions. The 768px breakpoint now wraps the navigation into a contained second row to prevent header collisions.

The Footer retains only existing routes and published footer/navigation links. It received stronger spacing, hierarchy, contrast, and responsive treatment; no nonexistent legal or contribution route was added.

## Responsive

Chromium headless visual evidence was captured from the final local production build at all required sizes:

| Viewport | Result | Evidence |
| --- | --- | --- |
| 390 × 844 | PASS — Hero, mobile navigation, headline, copy, and CTAs contained; no visible clipping | `phase17.11-responsive/homepage-390x844.png` |
| 393 × 852 | PASS — mobile composition contained and readable | `phase17.11-responsive/homepage-393x852.png` |
| 768 × 1024 | PASS — tablet header wraps into a contained navigation row; Hero remains within viewport | `phase17.11-responsive/homepage-768x1024.png` |
| 1440 × 900 | PASS — asymmetric editorial Hero, whitespace, visual panel, and navigation fit correctly | `phase17.11-responsive/homepage-1440x900.png` |

A targeted DOM sanity check returned `lang=ar`, `dir=rtl`, exactly one `h1`, zero unlabeled input/select/button controls in the inspected DOM, zero empty links, and equal document scroll/client widths in the inspected browser viewport. This is not a WCAG 2.2 AA certification, screen-reader verification, or cross-browser/device certification.

## Accessibility

The implementation uses semantic `main`, `section`, `header`, `nav`, `form`, `article`, headings, labels, `aria-labelledby`, `aria-live`, `role="status"`, `role="alert"`, and meaningful link/button semantics. Decorative visual elements are marked `aria-hidden`. The page retains visible focus styles from the central stylesheet and honors `prefers-reduced-motion`.

The available evidence supports **PASS WITH LIMITATION** for targeted structural checks. Screen-reader behavior, keyboard-only traversal by an external reviewer, measured WCAG 2.2 AA contrast, Firefox, Safari/WebKit, and assistive-technology certification remain external verification items.

## SEO

The homepage keeps its existing `title`, public root metadata, canonical `/`, robots, sitemap, and published-only person/category routes. No new JSON-LD was introduced by this phase, so no unsupported structured data or private contact fields were added. Account/Admin/preview privacy boundaries were not changed.

Result: **PASS WITH LIMITATION** pending final deployed-header smoke and the existing broader external SEO audit matrix.

## Performance

The homepage remains server-rendered and does not add a dependency. The catalog query is isolated behind `Suspense` and the existing five-second timeout; the Hero does not wait for people/categories. The optional Hero image is decorative and uses a background layer with no new asset; no carousel bundle or heavy animation was introduced.

A local targeted DOM navigation measurement recorded DOMContentLoaded at approximately 33.8ms in one browser run, but this is not a Core Web Vitals or production load-test result. Result: **PASS WITH LIMITATION**.

## Tests

The following checks passed after implementation iterations:

| Check | Result |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 15 files / 87 tests |
| `pnpm build` | PASS — 66 routes/pages |
| Targeted Chromium responsive captures | PASS for 390×844, 393×852, 768×1024, 1440×900 |
| DOM sanity check | PASS WITH LIMITATION |
| `git diff --check` | Required again after final report/commit; no known whitespace issues in current edits |

No migration runner, integration seed, test seed, production write, or database mutation was executed.

## Production Verification

Before this phase’s implementation commit, a read-only Production baseline smoke returned 200 for `/`, `/api/health`, `/categories`, `/search`, `/about`, `/login`, `/register`, `/robots.txt`, and `/sitemap.xml`; missing person/category routes returned 404; anonymous Admin pages returned 307; anonymous Admin APIs returned 401; the limited leakage scan returned no matches.

Final verification of the Homepage 2.0 commit is required after Vercel deployment. It must remain GET/HEAD-only and cover `/`, `/categories`, `/search`, `/register`, `/login`, `/robots.txt`, `/sitemap.xml`, `/api/health`, missing public routes, anonymous Admin boundaries, Hero/search/category HTML, and leakage markers. The final deployment ID and resulting evidence are recorded in the closeout message and attached smoke artifact.

## Deferred

The following items remain intentionally outside this phase or require additional evidence/configuration: full historical Timeline data and taxonomy; dedicated Suggest Person mutation; semantic/vector search and autocomplete; carousel; dark mode; Firefox/Safari/WebKit verification; screen-reader verification; measured WCAG 2.2 AA audit; formal font licensing review; real-device certification; Docker build/runtime validation; Android SDK/Gradle/device/signing; VPS/domain/backup/restore; load testing and production Core Web Vitals; and additional Arab-country content Population.

## Security

No authentication, Admin authentication, RBAC, permissions, ownership, privacy projection, publication lifecycle, storage, email provider, secret, Vercel configuration, endpoint, schema, or migration was changed. The homepage calls public server-side readers only and continues to use published projections. No new client-side secret or Admin API path was introduced.

## Data Safety

All Phase 17.11 counters are zero:

| Counter | Value |
| --- | ---: |
| Users created | 0 |
| Admins created | 0 |
| Editors created | 0 |
| People created | 0 |
| Categories created | 0 |
| Profiles created | 0 |
| CVs created | 0 |
| Files created | 0 |
| Seed records | 0 |
| Migrations executed | 0 |
| Schema changes | 0 |
| Production DDL | 0 |
| Production DML | 0 |
| Secrets changed | 0 |
| Providers changed | 0 |
| Vercel configuration changed | 0 |
| Temporary endpoints | 0 |

## Git

- Branch: `main`
- Pre-phase baseline: `e4b6a9cf0762cd2289f8930035f5861c033066ba`
- Implementation/report commit: recorded in the final closeout after normal commit and push
- Force push/reset/rebase/history rewrite: none
- Working tree: must be clean and `HEAD == origin/main` at final closeout

## Final Assessment

The visual and interaction goals of Homepage 2.0 are implemented without fabricating content or altering the platform’s trust boundaries. The phase is **COMPLETE WITH LIMITATIONS** until the final deployed commit receives the required GET/HEAD-only Production smoke and Git closeout. Population remains explicitly **NOT STARTED**, and Phase 18 remains **NOT STARTED**.

## Evidence References

[1]: `phase17.11-responsive/findings.md` — Chromium responsive and DOM sanity findings.
[2]: `/home/ubuntu/phase17.11-production-smoke.txt` — pre-implementation Production GET/HEAD-only baseline.
[3]: `/home/ubuntu/a3lam-phase13/tests/phase17.11.test.ts` — Homepage 2.0 regression tests.
[4]: `/home/ubuntu/a3lam-phase13/app/page.tsx` — Hero/catalog Suspense architecture.
[5]: `/home/ubuntu/a3lam-phase13/app/globals.css` — centralized Homepage 2.0 tokens and responsive layer.
