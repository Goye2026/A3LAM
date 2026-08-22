import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "drizzle", "migrations");

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and set a PostgreSQL URL.");
  return value;
}

export async function runMigrations(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const files = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const appliedRows = await sql`SELECT version FROM schema_migrations ORDER BY version`;
  const applied = new Set(appliedRows.map((row) => row.version));

  for (const file of files) {
    if (applied.has(file)) continue;
    const migration = await fs.readFile(path.join(migrationsDirectory, file), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration);
      await transaction`INSERT INTO schema_migrations (version) VALUES (${file})`;
    });
    console.log(`Applied migration ${file}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sql = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  try {
    await runMigrations(sql);
    console.log("Database migrations are up to date.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}
