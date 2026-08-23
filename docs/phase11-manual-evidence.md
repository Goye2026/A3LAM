# Phase 11 — Manual verification evidence

**Date:** 2026-08-23
**Scope:** local development verification only; no Neon/Vercel credentials and no production database were used.

## Evidence matrix

| Area | Result | Evidence |
|---|---|---|
| Unauthenticated admin page | PASS | `/admin` redirected to `/admin/login?next=%2Fadmin`. |
| Authenticated admin page | PASS | Temporary local token created an HttpOnly session and rendered `/admin`. |
| Logout | PASS | Logout cleared the session and returned to `/admin/login`. |
| Unauthenticated admin API | PASS | `GET /api/admin/people` returned HTTP 401 with a generic JSON response. |
| Authenticated API boundary | PASS | Authenticated `GET /api/admin/people` reached the route and returned 405 because list reads are server-rendered; mutation endpoints remain protected. |
| Empty/unavailable state | PASS | Dashboard handled the no-DB environment with a safe public message and zero counts. |
| Real dashboard/list | PASS | Local PostgreSQL dashboard showed 4 existing fixtures: 1 draft, 1 review, 1 published, 1 archived. `/admin/people` rendered the paginated table and lifecycle actions. |
| Filtering | PASS | `status=review` reduced the table to the single existing review fixture. |
| Protected preview | PASS | `/admin/people/dev-review-profile/preview` rendered the review record with protected-preview banner, status, biography, facts, and source section. |
| Public gate for review | PASS | `/person/dev-review-profile` rendered the public 404 surface. |
| Local lifecycle | PASS | A temporary local record completed `draft → review → published → archived`; source status was promoted at publish; the public page appeared only while published and returned 404 after archive. The record and source were deleted afterward. |
| Responsive Chromium | PASS | PNG captures retained at 390×844, 393×852, and 768×1024. Visual inspection of 390×844 and 768×1024 showed RTL card layout, readable hierarchy, touch-sized controls, and no visible horizontal overflow. |
| Firefox / Safari-WebKit / screen reader / measured contrast | PENDING EXTERNAL VERIFICATION | These environments and evidence tools are not available in the sandbox. |

## Draft form note

The editor exposes a dedicated **حفظ كمسودة** action. The final contract requires the stable slug and both identity names because the existing PostgreSQL schema enforces non-blank names; short biography, long biography, categories, occupations, sources, timeline, and education remain optional for a draft. An earlier slug-only browser submission correctly reached a generic server error because it violated that existing schema constraint; the UI was then aligned to mark both names as required while preserving optional draft content fields. No test fixture remained from that attempt.

## Retained artifacts

The responsive captures are stored under `docs/evidence/` as `admin-login-mobile-390.png`, `admin-login-mobile-393.png`, `admin-login-tablet-768.png`, and `public-404-mobile-390.png`. The local lifecycle and authentication evidence above is reproducible with the temporary development server and documented local PostgreSQL connection, but it must not be run against production without explicit operational approval.

## External verification boundary

This document does not mark Firefox, Safari/WebKit, screen-reader verification, measured WCAG 2.2 AA contrast, typography licensing, or cross-browser typography as complete. Those checks remain external and require their named environments and genuine reviewer evidence.

The live Chromium desktop check on `/admin/people` measured `innerWidth=1280`, `documentElement.scrollWidth=1280`, and `body.scrollWidth=1280`; therefore the page had no document-level horizontal overflow. The table’s own `.admin-table-wrap` remains the intentional local overflow container for narrow screens.

## Sitemap gate evidence

A local request to `/sitemap.xml` contained the existing published fixture `dev-published-test-profile` and did not contain `dev-draft-profile`, `dev-review-profile`, or `dev-archived-profile`. This confirms that the CMS lifecycle did not weaken the public sitemap gate.
