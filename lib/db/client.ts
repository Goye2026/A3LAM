import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

let sqlClient: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required for the database repository");
  return value;
}

export function getDb() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), {
      max: Number(process.env.DATABASE_MAX_CONNECTIONS ?? "5"),
      prepare: false,
    });
  }
  return drizzle(sqlClient, { schema });
}

export async function closeDb() {
  if (sqlClient) {
    await sqlClient.end({ timeout: 5 });
    sqlClient = null;
  }
}
