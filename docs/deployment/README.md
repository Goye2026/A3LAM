# A3LAM Deployment Handoff

This directory is the operational handoff for running A3LAM outside Vercel. It assumes Linux, Node.js `22.13.0`, pnpm `11.21.0`, and PostgreSQL. The same application remains deployable on Vercel; private hosting is an additional deployment option, not a replacement or a database migration.

## Choose a deployment mode

| Mode | Use | Required operator work |
|---|---|---|
| Vercel | Current managed deployment | Configure server-only environment variables in Vercel and deploy from `main` |
| Docker Compose | Small VPS or private server | Install Docker, create a protected `.env`, start the app and database, and place a reverse proxy in front |
| Node production server | Existing Node host | Install the locked toolchain, build, configure PostgreSQL, and run `pnpm start` under a supervisor |

## Standard private-hosting sequence

1. Provision Linux and PostgreSQL or use the included Compose database service.
2. Clone the repository at the intended release commit.
3. Create an untracked `.env` from `.env.example` and provide real values through a secret manager or protected file.
4. Install with `pnpm install --frozen-lockfile`.
5. Run `pnpm db:migrate` exactly once for a new database. The shared migration runner is the only supported migration path.
6. Build with `pnpm build` and start with `pnpm start`, or use the Docker Compose runbook.
7. Put Nginx or another reverse proxy in front, terminate HTTPS, and set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.
8. Probe `/api/health`, then perform read-only public and Admin checks with an authorized session.
9. Configure scheduled backups and verify a restore on a separate database before relying on the deployment.

Do not run seed scripts in Production. Do not copy `DATABASE_URL`, Admin tokens, storage tokens, or any other secret into Git, an image, a client bundle, or an issue.

## Related runbooks

Read `docker.md`, `vps.md`, `environment.md`, `database.md`, `domain.md`, `backup-restore.md`, and `troubleshooting.md` before operating a private deployment.
