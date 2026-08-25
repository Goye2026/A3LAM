export type MigrationRunResult = { status: "applied" | "up_to_date"; version: string | null };
export type MigrationTransaction = ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>) & { unsafe: (query: string) => Promise<unknown> };
export declare class MigrationRegistryInconsistentError extends Error {}
export declare class MigrationAlreadyAppliedError extends Error {}
export declare class MigrationPrerequisiteError extends Error {}
export declare class MigrationStateChangedError extends Error {}
export declare function runNextMigration(sql: MigrationTransaction, options?: { expectedVersion?: string; afterMigration?: (transaction: MigrationTransaction, version: string) => Promise<void> }): Promise<MigrationRunResult>;
export declare function runMigrations(sql: MigrationTransaction, options?: { onApplied?: (version: string) => Promise<void> }): Promise<string[]>;
