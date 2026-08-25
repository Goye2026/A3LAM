# PostgreSQL Backup and Restore

## Policy

Backups are an operational responsibility of the deployment owner. Store encrypted backups outside the application host and restrict access to the database operators. Do not store dumps in Git, Docker images, public object storage, or the web root.

## Backup

Use a PostgreSQL client version compatible with the target server and write to a protected path:

```bash
umask 077
pg_dump --format=custom --no-owner --file=/secure/backups/a3lam-$(date -u +%Y%m%dT%H%M%SZ).dump "$DATABASE_URL"
```

The shell environment or secret manager must supply `DATABASE_URL`; never paste it into a ticket or command transcript. Schedule backups at a frequency appropriate to editorial activity, retain multiple daily and weekly copies, and monitor backup job success and storage capacity.

## Restore verification

Never restore over the live database as a test. Provision a separate empty PostgreSQL database, load a copy of the dump, and verify:

```bash
createdb a3lam_restore_check
pg_restore --exit-on-error --no-owner --dbname="$RESTORE_DATABASE_URL" /secure/backups/a3lam-YYYYMMDDTHHMMSSZ.dump
```

Run read-only checks for migration registry consistency, expected tables, public publication filtering, Admin login boundary, and `/api/health` against the isolated restore. Remove the verification database only after the evidence is recorded and the operator confirms that it is not needed. This runbook does not execute any restore or delete any database.

## Recovery

For an actual recovery, stop writes according to the incident plan, identify the approved restore point, preserve the failed database for investigation, restore to a controlled target, validate schema and access boundaries, and cut over only after explicit owner approval. Rotate credentials if compromise is suspected. Phase 17.7 does not perform recovery or credential rotation.
