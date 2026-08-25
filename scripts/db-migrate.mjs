import postgres from "postgres";
import { runMigrations } from "../lib/db/migrations/runner.mjs";

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and set a PostgreSQL URL.");
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sql = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  try {
    await runMigrations(sql, { onApplied: (version) => console.log(`Applied migration ${version}`) });
    console.log("Database migrations are up to date.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export { requireDatabaseUrl, runMigrations };
