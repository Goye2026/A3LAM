# Phase 02 Foundation Acceptance

## Locked Baseline

| Tool | Version |
|---|---|
| Next.js | 16.3.1 |
| React | 19.2.8 |
| TypeScript | 6.0.2 |
| Node.js | 22.13.0 |
| pnpm | 11.21.0 |

The repository lockfile is `pnpm-lock.yaml`. CI must install with `pnpm install --frozen-lockfile`.

## Required Checks

The required validation sequence is:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

A check is Pass only when the command exits with code 0 and produces no unreviewed warning that changes the result or hides an error.

## Localization Acceptance Contract

The supported locales are `ar` and `en`, with Arabic as the primary and deterministic fallback locale. `lib/i18n/resolve.ts` defines the resolution contract: resolve the requested locale first, then fall back to Arabic when the key is absent, and return the explicit marker `[missing:<key>]` when the key is absent from both catalogs. Pluralization uses the platform `Intl.PluralRules` categories for the requested locale and selects the `other` form when a category is unavailable. Placeholder interpolation for `{count}` is deterministic and performed after plural form selection.

Automated coverage lives in `tests/i18n.test.ts` and must pass for normal Arabic resolution, normal English resolution, pluralized resolution, missing-key behavior, and locale fallback. The localization criterion is Pass only when all five cases pass and the resolver remains domain-neutral.

## Browser and Device Matrix

The initial foundation review covers Arabic RTL and mixed Arabic/Latin content on the following representative combinations:

| Class | Browser | Viewport |
|---|---|---|
| Mobile | Chromium stable | 390 × 844 |
| Mobile | Safari/WebKit equivalent | 393 × 852 |
| Tablet | Chromium stable | 768 × 1024 |
| Desktop | Chromium stable | 1440 × 900 |
| Desktop | Firefox stable | 1440 × 900 |

The reviewer verifies direction, focus order, keyboard reachability, icon placement, logical spacing, responsive wrapping, text scaling, and mixed-script rendering. This is a foundation check, not a claim of product-wide WCAG compliance.

## Accessibility Foundation

The foundation target is WCAG 2.2 AA. The review covers semantic headings, accessible names, visible focus, keyboard operation, contrast of semantic tokens, RTL reading order, reduced-motion behavior, and responsive text. Automated checks do not replace manual keyboard and screen-reader review.

## Token Source of Truth

Design tokens are defined in `app/globals.css`. Reusable primitives consume semantic classes and variables rather than arbitrary visual values. Any token change must be reviewed as a design-system change.

## Logging and Privacy

`lib/observability/logger.ts` defines structured log shape, correlation IDs, and recursive redaction of keys that may contain passwords, tokens, secrets, API keys, authorization data, cookies, email, phone, address, or credentials. No production monitoring provider is connected in Phase 02.

## Exclusion Audit

The Phase 02 output must remain free of Person screens, Person domain models, database tables, production seed data, Search, Authentication, Authorization implementation, Contributions, Verification, Comments, AI, Knowledge Graph, Full Admin, production migrations, production deployment, external search providers, and authentication-provider integration. Fixtures are foundation-neutral only.
