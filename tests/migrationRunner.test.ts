import { describe, expect, it } from "vitest";
import { MigrationPrerequisiteError, MigrationRegistryInconsistentError, MigrationStateChangedError, runNextMigration } from "@/lib/db/migrations/runner.mjs";

type FakeState = { applied: string[]; unsafeQueries: string[]; calls: string[] };

type FakeSql = { begin: (callback: (transaction: FakeTransaction) => Promise<void>) => Promise<void> };
type FakeTransaction = ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>) & { unsafe: (query: string) => Promise<void> };

function createFakeSql(applied: string[]): { sql: FakeSql; state: FakeState } {
  const state: FakeState = { applied, unsafeQueries: [], calls: [] };
  const sql: FakeSql = {
    begin: async (callback) => {
      const transaction = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join("?");
        state.calls.push(query);
        if (query.includes("SELECT version FROM schema_migrations")) return state.applied.map((version) => ({ version }));
        if (query.includes("INSERT INTO schema_migrations")) {
          const version = values[0];
          if (typeof version === "string") state.applied.push(version);
        }
        return [];
      }) as FakeTransaction;
      transaction.unsafe = async (query) => { state.unsafeQueries.push(query); };
      await callback(transaction);
    },
  };
  return { sql, state };
}

describe("shared migration runner", () => {
  it("applies only the next migration and records the advisory lock", async () => {
    const { sql, state } = createFakeSql(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql"]);
    const result = await runNextMigration(sql as never, { expectedVersion: "0004_phase17_1_admin_identity.sql" });
    expect(result).toEqual({ status: "applied", version: "0004_phase17_1_admin_identity.sql" });
    expect(state.applied).toEqual(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0004_phase17_1_admin_identity.sql"]);
    expect(state.unsafeQueries).toHaveLength(1);
    expect(state.calls.some((query) => query.includes("pg_advisory_xact_lock"))).toBe(true);
  });

  it("rejects a missing prerequisite before reading or executing the migration", async () => {
    const { sql, state } = createFakeSql(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql"]);
    await expect(runNextMigration(sql as never)).rejects.toBeInstanceOf(MigrationPrerequisiteError);
    expect(state.unsafeQueries).toHaveLength(0);
  });

  it("rejects an unexpected or out-of-order registry", async () => {
    const unexpected = createFakeSql(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0009_unknown.sql"]);
    await expect(runNextMigration(unexpected.sql as never)).rejects.toBeInstanceOf(MigrationRegistryInconsistentError);

    const skipped = createFakeSql(["0001_a3lam_core.sql", "0003_phase13_profiles.sql"]);
    await expect(runNextMigration(skipped.sql as never)).rejects.toBeInstanceOf(MigrationRegistryInconsistentError);
  });

  it("rejects stale preflight state and does not execute a different target", async () => {
    const { sql, state } = createFakeSql(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql"]);
    await expect(runNextMigration(sql as never, { expectedVersion: "0005_phase17_2_rbac_management.sql" })).rejects.toBeInstanceOf(MigrationStateChangedError);
    expect(state.unsafeQueries).toHaveLength(0);
  });

  it("rejects a duplicate expected execution after the target is already applied", async () => {
    const { sql, state } = createFakeSql(["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0004_phase17_1_admin_identity.sql"]);
    await expect(runNextMigration(sql as never, { expectedVersion: "0004_phase17_1_admin_identity.sql" })).rejects.toBeInstanceOf(MigrationStateChangedError);
    expect(state.unsafeQueries).toHaveLength(0);
  });
});
