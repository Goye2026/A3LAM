import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profileFiles, siteExperienceConfigs } from "@/lib/db/schema";
import { isAdminAccessConfigured } from "@/lib/admin/auth";
import { getStorageStatus } from "@/lib/storage/provider";
import { MIGRATION_VERSIONS } from "@/lib/db/migrations/manifest.mjs";

const REQUIRED_MIGRATIONS = MIGRATION_VERSIONS;

type Availability = "available" | "unavailable" | "requires_configuration" | "requires_schema" | "requires_migration";

export type SystemHealthSnapshot = {
  database: "available" | "unavailable";
  auth: "available" | "requires_configuration";
  storage: "ready" | "requires_configuration";
  email: "requires_configuration";
  configuration: Availability;
  migrations: {
    status: Availability;
    applied: number | null;
    pending: number | null;
  };
  siteExperience: {
    status: Availability;
    resources: number | null;
    drafts: number | null;
    published: number | null;
  };
  mediaFiles: number | null;
};

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  let database: SystemHealthSnapshot["database"] = "available";
  let configuration: Availability = "requires_schema";
  let migrations: SystemHealthSnapshot["migrations"] = { status: "requires_schema", applied: null, pending: null };
  let siteExperience: SystemHealthSnapshot["siteExperience"] = { status: "requires_schema", resources: null, drafts: null, published: null };
  let mediaFiles: number | null = null;
  let db = null as ReturnType<typeof getDb> | null;

  try {
    db = getDb();
    await db.execute(sql`select 1`);
    const rows = await db.select({ count: sql<string>`count(*)` }).from(profileFiles);
    mediaFiles = Number(rows[0]?.count ?? 0);
  } catch {
    database = "unavailable";
  }

  if (db && database === "available") {
    try {
      const migrationTable = await db.execute(sql<{ name: string | null }>`select to_regclass('public.schema_migrations') as name`);
      if (migrationTable[0]?.name) {
        const appliedRows = await db.execute(sql<{ version: string }>`select version from schema_migrations order by version`);
        const appliedSet = new Set(appliedRows.map((row) => row.version));
        const applied = REQUIRED_MIGRATIONS.filter((version) => appliedSet.has(version)).length;
        migrations = { status: applied === REQUIRED_MIGRATIONS.length ? "available" : "requires_migration", applied, pending: REQUIRED_MIGRATIONS.length - applied };
      }
    } catch {
      migrations = { status: "requires_schema", applied: null, pending: null };
    }

    try {
      const rows = await db.select({ resource: siteExperienceConfigs.resource, draft: siteExperienceConfigs.draft, published: siteExperienceConfigs.published }).from(siteExperienceConfigs);
      const drafts = rows.filter((row) => row.draft !== null).length;
      const published = rows.filter((row) => row.published !== null).length;
      siteExperience = { status: "available", resources: rows.length, drafts, published };
      configuration = "available";
    } catch {
      configuration = "requires_schema";
      siteExperience = { status: "requires_schema", resources: null, drafts: null, published: null };
    }
  } else {
    configuration = "unavailable";
    migrations = { status: "unavailable", applied: null, pending: null };
    siteExperience = { status: "unavailable", resources: null, drafts: null, published: null };
  }

  return {
    database,
    auth: isAdminAccessConfigured() ? "available" : "requires_configuration",
    storage: getStorageStatus(),
    email: "requires_configuration",
    configuration,
    migrations,
    siteExperience,
    mediaFiles,
  };
}

export { REQUIRED_MIGRATIONS };
export type { Availability };
