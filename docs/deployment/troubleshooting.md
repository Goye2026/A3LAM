# Troubleshooting

## First checks

Check the process supervisor or Compose status, application logs without secrets, PostgreSQL readiness, disk space, DNS, TLS expiry, and `/api/health`. Do not expose raw stack traces or connection strings in a public response.

| Symptom | Safe checks | Correct interpretation |
|---|---|---|
| App will not start | Check Node/pnpm versions, `pnpm build`, process logs, and required environment names | Missing required environment or build failure; do not guess credentials |
| `/api/health` unavailable | Check process status, port binding, reverse proxy upstream, and firewall | Application or proxy availability issue |
| Database-backed page unavailable | Check PostgreSQL readiness and server-only `DATABASE_URL` configuration | Database unavailable or misconfigured; do not run a migration automatically |
| Storage upload returns 503 | Check the three external storage variables and provider status | `REQUIRES CONFIGURATION`; no filesystem fallback is expected |
| Email action unavailable | Check provider configuration and application status projection | `PROVIDER_NOT_CONFIGURED`; do not add a provider during an incident |
| Admin page redirects to login | Verify the Admin session and owner-controlled access path | Authentication boundary is working; do not bypass it |
| Admin API returns 401/403 | Verify the session and effective permission | Unauthorized/forbidden; do not rely on hidden buttons or URL obscurity |
| Public page shows no records | Confirm the database is available and publication filter is intentional | Empty published projection is not automatically a database error |
| Docker app unhealthy | Inspect `docker compose ps`, app logs, and the `/api/health` probe | Fix process/configuration; do not disable healthchecks silently |
| HTTPS redirect loop | Inspect `X-Forwarded-Proto` and the reverse proxy policy | Proxy header/canonical origin issue; keep one canonical HTTPS origin |

## Migration safety

The migration runner is not a troubleshooting shortcut. Before any migration operation, inspect `schema_migrations`, the manifest, backup status, and the deployment plan. For the existing Production database in this project, Phase 17.7 explicitly performs no migration execution.

## Incident boundary

If a fix requires a new secret, provider, schema change, Production DML, auth/RBAC bypass, destructive restore, or Vercel environment change, stop the affected workstream and obtain owner authorization. Record `BLOCKED`, `SCHEMA_CHANGE_REQUIRED`, or `REQUIRES CONFIGURATION` rather than applying an undocumented workaround.
