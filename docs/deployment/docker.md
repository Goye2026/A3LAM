# Docker Deployment

## Prerequisites

Install Docker Engine and the Docker Compose plugin on a supported Linux host. The repository provides a multi-stage `Dockerfile` based on Node.js `22.13.0` and pnpm `11.21.0`. The final image runs the normal Next.js production server with `pnpm start`; this was selected because the repository's pnpm dependency layout did not run reliably from a raw standalone server in the available local verification. The image does not contain a database client secret beyond runtime environment injection.

## Configure

Copy `.env.example` to an untracked `.env` and set real values through a protected secret store. For Compose, set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and the application variables. Do not use the placeholders as production credentials and do not publish `.env`.

## Build and start

```bash
docker compose config
docker compose build --pull
docker compose up -d
```

The Compose file starts PostgreSQL on an internal network with a named persistent volume and waits for `pg_isready`. The application healthcheck calls `/api/health`. The database port is not published by the provided Compose file; expose it only through a deliberate, protected operator configuration if required.

For a new empty database, run the migration runner once from a controlled application environment after PostgreSQL is healthy:

```bash
docker compose run --rm app pnpm db:migrate
```

This command is for a new private deployment only. Do not run it against the existing Production database during Phase 17.7 and do not run seed commands in Production.

## Operate

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 db
docker compose restart app
```

Use a reverse proxy for public HTTPS. Keep the application bound to the internal Docker network or the host loopback where possible. Back up the named PostgreSQL volume through PostgreSQL-native dumps rather than copying live database files.

## Verification state

Docker CLI was unavailable in the Phase 17.7 development sandbox. Therefore `docker build .` and `docker compose config` are documented but must be executed by the deployment operator before a Docker release is marked READY.
