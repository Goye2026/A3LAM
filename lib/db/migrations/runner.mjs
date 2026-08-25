import fs from "node:fs/promises";
import path from "node:path";
import { MIGRATION_VERSIONS } from "./manifest.mjs";

const migrationsDirectory = path.join(process.cwd(), "drizzle", "migrations");
const migrationLockKey = "a3lam:production:migration-control";

export class MigrationRegistryInconsistentError extends Error {
  constructor() {
    super("Migration registry is inconsistent");
    this.name = "MigrationRegistryInconsistentError";
  }
}

export class MigrationAlreadyAppliedError extends Error {
  constructor(version) {
    super(`Migration ${version} is already applied`);
    this.name = "MigrationAlreadyAppliedError";
  }
}

export class MigrationPrerequisiteError extends Error {
  constructor() {
    super("Migration prerequisites are not satisfied");
    this.name = "MigrationPrerequisiteError";
  }
}

export class MigrationStateChangedError extends Error {
  constructor() {
    super("Migration state changed after preflight");
    this.name = "MigrationStateChangedError";
  }
}

async function readMigration(version) {
  if (!MIGRATION_VERSIONS.includes(version)) throw new MigrationRegistryInconsistentError();
  return fs.readFile(path.join(migrationsDirectory, version), "utf8");
}

export async function runNextMigration(sql, { afterMigration, expectedVersion } = {}) {
  let result = { status: "up_to_date", version: null };

  await sql.begin(async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(hashtextextended(${migrationLockKey}, 0))`;
    await transaction`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const appliedRows = await transaction`SELECT version FROM schema_migrations ORDER BY version`;
    const applied = new Set();
    for (const row of appliedRows) {
      if (applied.has(row.version) || !MIGRATION_VERSIONS.includes(row.version)) throw new MigrationRegistryInconsistentError();
      applied.add(row.version);
    }

    const firstPendingIndex = MIGRATION_VERSIONS.findIndex((version) => !applied.has(version));
    if (firstPendingIndex < 0) {
      if (expectedVersion) throw new MigrationStateChangedError();
      return;
    }
    if (MIGRATION_VERSIONS.slice(firstPendingIndex + 1).some((version) => applied.has(version))) throw new MigrationRegistryInconsistentError();

    if (firstPendingIndex < 3) throw new MigrationPrerequisiteError();
    const version = MIGRATION_VERSIONS[firstPendingIndex];
    if (expectedVersion && expectedVersion !== version) throw new MigrationStateChangedError();
    const migration = await readMigration(version);
    await transaction.unsafe(migration);
    await transaction`INSERT INTO schema_migrations (version) VALUES (${version})`;
    if (afterMigration) await afterMigration(transaction, version);
    result = { status: "applied", version };
  });

  return result;
}

export async function runMigrations(sql, { onApplied } = {}) {
  const applied = [];
  while (true) {
    const result = await runNextMigration(sql);
    if (result.status === "up_to_date") return applied;
    applied.push(result.version);
    if (onApplied) await onApplied(result.version);
  }
}
