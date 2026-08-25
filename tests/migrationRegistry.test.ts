import { describe, expect, it } from "vitest";
import { compareMigrationRegistry, evaluateMigrationPreflight } from "@/lib/admin/migrationRegistry";

const expected = ["0001.sql", "0002.sql", "0003_phase13_profiles.sql"];

function row(version: string, appliedAt = "2026-08-25T10:00:00.000Z") {
  return { version, appliedAt };
}

describe("migration registry comparison", () => {
  it("marks a complete ordered registry as healthy", () => {
    const result = compareMigrationRegistry(expected, expected.map((version) => row(version)));
    expect(result.status).toBe("healthy");
    expect(result.appliedCount).toBe(3);
    expect(result.pendingCount).toBe(0);
    expect(result.items.every((item) => item.state === "APPLIED")).toBe(true);
  });

  it("marks a missing migration as pending", () => {
    const result = compareMigrationRegistry(expected, [row("0001.sql"), row("0002.sql")]);
    expect(result.status).toBe("pending");
    expect(result.pendingCount).toBe(1);
    expect(result.items.at(-1)).toMatchObject({ version: "0003_phase13_profiles.sql", applied: false, state: "PENDING", appliedAt: null });
  });

  it("marks an unexpected production version as inconsistent", () => {
    const result = compareMigrationRegistry(expected, [row("0001.sql"), row("0002.sql"), row("0003_phase13_profiles.sql"), row("0007_unknown.sql")]);
    expect(result.status).toBe("inconsistent");
    expect(result.items.at(-1)).toMatchObject({ version: "0007_unknown.sql", source: "production", state: "UNEXPECTED" });
  });

  it("marks an applied later migration with a missing prerequisite as inconsistent", () => {
    const result = compareMigrationRegistry(expected, [row("0001.sql"), row("0003_phase13_profiles.sql")]);
    expect(result.status).toBe("inconsistent");
    expect(result.items.find((item) => item.version === "0002.sql")).toMatchObject({ state: "PENDING" });
  });

  it("detects duplicate versions in the applied registry", () => {
    const result = compareMigrationRegistry(expected, [row("0001.sql"), row("0001.sql")]);
    expect(result.status).toBe("inconsistent");
  });

  it("detects duplicate repository versions and handles an empty registry", () => {
    const duplicate = compareMigrationRegistry(["0001.sql", "0001.sql"], []);
    expect(duplicate.status).toBe("inconsistent");
    expect(duplicate.pendingCount).toBe(1);

    const empty = compareMigrationRegistry([], []);
    expect(empty.status).toBe("healthy");
    expect(empty.expectedCount).toBe(0);
  });

  it("authorizes only the next migration when prerequisites and files are ready", () => {
    const versions = ["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0004_phase17_1_admin_identity.sql", "0005_phase17_2_rbac_management.sql", "0006_phase17_3_site_experience.sql"];
    const registry = compareMigrationRegistry(versions, [row(versions[0]), row(versions[1]), row(versions[2])]);
    const result = evaluateMigrationPreflight({ registrySnapshot: registry, databaseAvailable: true, filesAvailable: true });
    expect(result.execution).toBe("eligible");
    expect(result.reason).toBe("NONE");
    expect(result.nextMigration).toBe("0004_phase17_1_admin_identity.sql");
    expect(result.prerequisites.every((item) => item.applied)).toBe(true);
  });

  it("blocks execution when prerequisite 0003 is missing", () => {
    const versions = ["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0004_phase17_1_admin_identity.sql"];
    const registry = compareMigrationRegistry(versions, [row(versions[0]), row(versions[1])]);
    const result = evaluateMigrationPreflight({ registrySnapshot: registry, databaseAvailable: true, filesAvailable: true });
    expect(result.execution).toBe("blocked");
    expect(result.reason).toBe("PREREQUISITE_MISSING");
    expect(result.nextMigration).toBe("0003_phase13_profiles.sql");
  });

  it("blocks execution when registry is inconsistent, database is unavailable, or files are missing", () => {
    const versions = ["0001_a3lam_core.sql", "0002_a3lam_integrity.sql", "0003_phase13_profiles.sql", "0004_phase17_1_admin_identity.sql"];
    const inconsistent = compareMigrationRegistry(versions, [row(versions[0]), row(versions[1]), row(versions[2]), row("0009_unknown.sql")]);
    expect(evaluateMigrationPreflight({ registrySnapshot: inconsistent, databaseAvailable: true, filesAvailable: true }).reason).toBe("REGISTRY_INCONSISTENT");

    const pending = compareMigrationRegistry(versions, [row(versions[0]), row(versions[1]), row(versions[2])]);
    expect(evaluateMigrationPreflight({ registrySnapshot: pending, databaseAvailable: false, filesAvailable: true }).reason).toBe("DATABASE_UNAVAILABLE");
    expect(evaluateMigrationPreflight({ registrySnapshot: pending, databaseAvailable: true, filesAvailable: false }).reason).toBe("MIGRATION_FILES_UNAVAILABLE");
  });
});
