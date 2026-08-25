import { describe, expect, it } from "vitest";
import { isMigrationExecutionConfirmation, MIGRATION_EXECUTION_CONFIRMATION } from "@/lib/admin/migrationExecution";

describe("migration execution confirmation", () => {
  it("accepts only the fixed confirmation payload", () => {
    expect(isMigrationExecutionConfirmation({ confirm: MIGRATION_EXECUTION_CONFIRMATION })).toBe(true);
  });

  it("rejects arbitrary targets, SQL, connection data, and extra fields", () => {
    expect(isMigrationExecutionConfirmation({ confirm: MIGRATION_EXECUTION_CONFIRMATION, run: "0006_phase17_3_site_experience.sql" })).toBe(false);
    expect(isMigrationExecutionConfirmation({ confirm: MIGRATION_EXECUTION_CONFIRMATION, sql: "DROP TABLE users" })).toBe(false);
    expect(isMigrationExecutionConfirmation({ confirm: MIGRATION_EXECUTION_CONFIRMATION, DATABASE_URL: "postgres://secret" })).toBe(false);
    expect(isMigrationExecutionConfirmation({ confirm: "0006_phase17_3_site_experience.sql" })).toBe(false);
    expect(isMigrationExecutionConfirmation(null)).toBe(false);
    expect(isMigrationExecutionConfirmation([MIGRATION_EXECUTION_CONFIRMATION])).toBe(false);
  });
});
