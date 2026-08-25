import { describe, expect, it } from "vitest";
import { compareMigrationRegistry } from "@/lib/admin/migrationRegistry";

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
});
