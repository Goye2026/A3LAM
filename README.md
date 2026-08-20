# A3LAM — Phase 02 Foundation

This project is the **Foundation & Design System** implementation for A3LAM. It is intentionally domain-neutral and does not implement Person, Search, Authentication, Contributions, Verification, Comments, AI, Knowledge Graph, Full Admin, production database schema, migrations, seed data, or deployment.

## Locked Toolchain

- Next.js `16.3.1`
- React `19.2.8`
- TypeScript `6.0.2`
- Node.js `22.13.0`
- pnpm `11.21.0`

The lockfile is authoritative. Local development and CI must use the same Node.js and pnpm baseline, and dependency installation must use `pnpm install --frozen-lockfile`.

## Repository Structure

```text
app/                 App Router shell, layout, global styles
lib/i18n/            Locale registry and foundation-neutral messages
tests/               Foundation-only tests
next.config.ts       Next.js configuration
eslint.config.mjs    Flat ESLint configuration
tsconfig.json        TypeScript configuration
vitest.config.ts     Test configuration
```

The import direction is intentionally simple: `app` may consume `lib`, while `lib` does not import UI or domain modules. No domain layer is present in Phase 02.

## Localization

The locale registry defines `ar` as the primary locale and `en` as the future LTR locale. Message keys are centralized in `lib/i18n/messages.ts`, with Arabic fallback behavior defined in `lib/i18n/config.ts`. The current route uses the Arabic default locale and foundation-neutral sample strings only.

## Validation Commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Scope Guard

Any request that requires a domain entity, production data, authentication, search, database migrations, or deployment must stop and be reviewed against the Phase 01 architecture before implementation.
