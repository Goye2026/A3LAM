# Phase 17.8 — Launch Hardening Audit

## Baseline

| Item | Observed state |
|---|---|
| Branch | `main` |
| Last known commit | `98b553d49341542a9a78716cf5ef6213ac712702` |
| Next.js | `16.3.1` |
| React / React DOM | `19.2.8` |
| TypeScript | `6.0.2` |
| ESLint | `9.39.5` |
| Node.js in sandbox | `22.13.0` |
| pnpm | `11.21.0` |
| packageManager | `pnpm@11.21.0` |
| package engines | absent; intentionally not added because Vercel runtime must not be changed implicitly |
| Vercel project metadata | Node.js `24.x` |
| Docker CLI | unavailable |
| Android SDK / Gradle / ADB | unavailable |
| Java | OpenJDK 21.0.11 |

## Decisions

### Runtime parity

`.node-version` is added with `22.13.0`, and the Docker/VPS baseline remains explicit. No `engines` field was added to `package.json`, and no Vercel runtime setting was changed, because either could alter the current managed deployment implicitly. The difference is documented as owner configuration when strict Vercel parity is required.

### Docker

The existing multi-stage image is retained with the normal Next.js production server (`pnpm start`) rather than standalone output. A non-root `USER node` is added in the runtime stage. Compose continues to gate the app on PostgreSQL health and uses an internal database network. Docker build/config execution is `READY FOR EXTERNAL VERIFICATION` because the CLI is unavailable here.

### Domain and origin

`NEXT_PUBLIC_SITE_URL` remains the canonical origin input. In Production it must be a valid HTTPS origin. Existing same-origin mutation checks, internal redirect sanitizer, HttpOnly Admin cookie, same-site policy, and no-cookie-domain behavior are documented rather than rewritten.

### Android

The existing HTTPS wrapper foundation and package ID are retained. No native rewrite or heavy dependency is introduced. The external build boundary, security rules, and signing requirements are documented; no APK/AAB or keystore is fabricated.

## Security observations

The reviewed security headers include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and production HSTS. Admin access uses the existing session/token primitives and server-side authorization. Public projection and publication filtering remain unchanged. The audit did not print or inspect secret values.

## Performance observations

The codebase already uses bounded lists, timeout wrappers around site experience reads, route-level server rendering, and a normal Node production server. Phase 17.8 does not start a broad performance rewrite, add analytics, or introduce a new data-fetching layer.

## Required limitations

Docker, Android device/build, full cross-browser, screen-reader, measured WCAG 2.2 AA, external VPS, DNS/TLS cutover, provider configuration, Production backup/restore, and strict Vercel Node 22 parity require external verification or owner configuration. No workaround is authorized for these boundaries.
