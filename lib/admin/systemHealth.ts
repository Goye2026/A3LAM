import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profileFiles, siteExperienceConfigs } from "@/lib/db/schema";
import { getStorageStatus } from "@/lib/storage/provider";

export type SystemHealthSnapshot = {
  database: "available" | "unavailable";
  storage: "ready" | "requires_configuration";
  email: "requires_configuration";
  configuration: "available" | "requires_schema";
  mediaFiles: number | null;
};

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  let database: SystemHealthSnapshot["database"] = "available";
  let configuration: SystemHealthSnapshot["configuration"] = "requires_schema";
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
      await db.select({ resource: siteExperienceConfigs.resource }).from(siteExperienceConfigs).limit(1);
      configuration = "available";
    } catch {
      configuration = "requires_schema";
    }
  }
  return { database, storage: getStorageStatus(), email: "requires_configuration", configuration, mediaFiles };
}
