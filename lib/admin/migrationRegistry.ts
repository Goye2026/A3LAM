import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { REQUIRED_MIGRATIONS } from "@/lib/admin/systemHealth";

export type MigrationRegistryItem = {
  version: string;
  applied: boolean;
  appliedAt: string | null;
  source: "repository" | "production";
  state: "APPLIED" | "PENDING" | "UNEXPECTED";
};

export type MigrationRegistryStatus = {
  status: "healthy" | "pending" | "inconsistent" | "unavailable";
  appliedCount: number;
  pendingCount: number;
  expectedCount: number;
  items: MigrationRegistryItem[];
};

type AppliedMigrationRow = { version: string; appliedAt: Date | string | null };

export function compareMigrationRegistry(expectedVersions: string[], appliedRows: AppliedMigrationRow[]): MigrationRegistryStatus {
  const expected = [...new Set(expectedVersions)].sort();
  const duplicateExpected = expected.length !== expectedVersions.length;
  const appliedByVersion = new Map<string, string | null>();
  let duplicateApplied = false;

  for (const row of appliedRows) {
    if (appliedByVersion.has(row.version)) duplicateApplied = true;
    appliedByVersion.set(row.version, normalizeAppliedAt(row.appliedAt));
  }

  const items: MigrationRegistryItem[] = expected.map((version) => ({
    version,
    applied: appliedByVersion.has(version),
    appliedAt: appliedByVersion.get(version) ?? null,
    source: "repository",
    state: appliedByVersion.has(version) ? "APPLIED" : "PENDING",
  }));

  for (const row of appliedRows) {
    if (!expected.includes(row.version)) {
      items.push({
        version: row.version,
        applied: true,
        appliedAt: normalizeAppliedAt(row.appliedAt),
        source: "production",
        state: "UNEXPECTED",
      });
    }
  }

  const appliedExpectedCount = expected.filter((version) => appliedByVersion.has(version)).length;
  const pendingCount = expected.length - appliedExpectedCount;
  const unexpected = items.some((item) => item.state === "UNEXPECTED");
  const firstPendingIndex = expected.findIndex((version) => !appliedByVersion.has(version));
  const appliedAfterPending = firstPendingIndex >= 0 && expected.slice(firstPendingIndex + 1).some((version) => appliedByVersion.has(version));
  const inconsistent = duplicateExpected || duplicateApplied || unexpected || appliedAfterPending;

  return {
    status: inconsistent ? "inconsistent" : pendingCount > 0 ? "pending" : "healthy",
    appliedCount: appliedExpectedCount,
    pendingCount,
    expectedCount: expected.length,
    items,
  };
}

function normalizeAppliedAt(value: Date | string | null) {
  if (value === null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function getRepositoryMigrationVersions() {
  return [...REQUIRED_MIGRATIONS];
}

function isMissingMigrationRegistry(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01";
}

export async function getMigrationRegistryStatus(): Promise<MigrationRegistryStatus> {
  try {
    const expectedVersions = await getRepositoryMigrationVersions();
    const db = getDb();
    const table = await db.execute(sql<{ name: string | null }>`select to_regclass('public.schema_migrations') as name`);
    if (!table[0]?.name) {
      return { status: "unavailable", appliedCount: 0, pendingCount: expectedVersions.length, expectedCount: expectedVersions.length, items: expectedVersions.map((version) => ({ version, applied: false, appliedAt: null, source: "repository", state: "PENDING" })) };
    }

    const rows = await db.execute(sql`select version, applied_at from schema_migrations order by version`);
    const appliedRows = rows.map((row) => {
      const record = row as Record<string, unknown>;
      return { version: typeof record.version === "string" ? record.version : "", appliedAt: record.applied_at instanceof Date || typeof record.applied_at === "string" || record.applied_at === null ? record.applied_at : null };
    });
    if (appliedRows.some((row) => !row.version)) return { status: "inconsistent", appliedCount: 0, pendingCount: expectedVersions.length, expectedCount: expectedVersions.length, items: [] };
    return compareMigrationRegistry(expectedVersions, appliedRows);
  } catch (error) {
    if (isMissingMigrationRegistry(error)) {
      return { status: "unavailable", appliedCount: 0, pendingCount: 0, expectedCount: 0, items: [] };
    }
    return { status: "unavailable", appliedCount: 0, pendingCount: 0, expectedCount: 0, items: [] };
  }
}

export { getRepositoryMigrationVersions };
