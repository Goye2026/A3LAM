# Environment Management

## Variable classification

| Variable | Class | Server/client | Notes |
|---|---|---|---|
| `NODE_ENV` | Required | Server | Use `production` on a release host |
| `LOG_LEVEL` | Optional | Server | Keep logs safe; do not log request secrets |
| `PORT` | Optional | Server | Defaults to the platform/server port |
| `HOSTNAME` | Optional | Server | Use `0.0.0.0` in a container; loopback behind a local reverse proxy |
| `DATABASE_URL` | Required for data routes | Server-only | PostgreSQL connection string; never expose or print |
| `DATABASE_MAX_CONNECTIONS` | Optional | Server-only | postgres.js pool limit; default is application-defined |
| `NEXT_PUBLIC_SITE_URL` | Required for public release | Public build/runtime | Canonical HTTPS origin for metadata and sitemap |
| `A3LAM_ADMIN_ACCESS_TOKEN` | Required for Admin CMS | Server-only | Random secret with at least 32 characters |
| `A3LAM_ADMIN_SESSION_TTL_SECONDS` | Optional | Server-only | Signed session lifetime within application limits |
| `A3LAM_STORAGE_UPLOAD_URL` | Optional provider-specific | Server-only | External object-storage upload endpoint |
| `A3LAM_STORAGE_PUBLIC_BASE_URL` | Optional provider-specific | Server-only | Public object-storage base URL |
| `A3LAM_STORAGE_UPLOAD_TOKEN` | Optional provider-specific | Server-only | External storage credential |
| `A3LAM_ALLOW_SYNTHETIC_SEED` | Development-only | Server | Must remain false/unset in Production |
| `POSTGRES_DB` | Compose-only | Server/Compose | Placeholder-backed database name |
| `POSTGRES_USER` | Compose-only | Server/Compose | Placeholder-backed database user |
| `POSTGRES_PASSWORD` | Compose-only secret | Server/Compose | Supply through protected `.env` or secret store |
| `APP_PORT` | Compose-only | Server/Compose | Host port mapping; defaults to 3000 |

## Rules

The committed `.env.example` contains placeholders only. Create `.env.local` for local development or a protected `.env`/secret-manager entry for private hosting. Never commit a real URL, password, token, private key, or API key. Do not place server-only variables in `NEXT_PUBLIC_*` names or Android assets.

`DATABASE_URL` is required for database-backed routes but must remain server-side. `NEXT_PUBLIC_SITE_URL` may be visible because it is a public origin, but it must not contain credentials. Storage and email providers are optional; when unconfigured, the application must return its existing configuration state rather than silently falling back to local files or database blobs.

## Rotation

Rotate Admin and provider credentials through the host secret manager, then restart the application. Never record old or new values in Git history, logs, tickets, screenshots, or the release report. A secret rotation is an operational action and is not performed by the current final launch freeze.
