export const MIGRATION_EXECUTION_CONFIRMATION = "RUN_NEXT_MIGRATION" as const;

export function isMigrationExecutionConfirmation(body: unknown): body is { confirm: typeof MIGRATION_EXECUTION_CONFIRMATION } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  return keys.length === 1 && keys[0] === "confirm" && (body as { confirm?: unknown }).confirm === MIGRATION_EXECUTION_CONFIRMATION;
}
