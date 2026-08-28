import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const manifest = read("lib/db/migrations/manifest.mjs");
const runner = read("lib/db/migrations/runner.mjs");
const schema = read("lib/db/schema.ts");
const page = read("app/page.tsx");
const personRoute = read("app/person/[slug]/page.tsx");
const personService = read("lib/services/personService.ts");
const repository = read("lib/data/databaseRepository.ts");
const media = read("lib/media/repository.ts");
const activation = read("lib/ai/activation.ts");
const recovery = read("docs/PHASE_17_19_12_RECOVERY_PLAN.md");
const baseline = read("docs/PHASE_17_19_12_BASELINE.md");
const migrationGraph = read("docs/PHASE_17_19_12_MIGRATION_GRAPH.md");
const migrations = [
  "0001_a3lam_core.sql",
  "0002_a3lam_integrity.sql",
  "0003_phase13_profiles.sql",
  "0004_phase17_1_admin_identity.sql",
  "0005_phase17_2_rbac_management.sql",
  "0006_phase17_3_site_experience.sql",
  "0007_phase17_16_media_architecture.sql",
  "0008_phase17_18_2_ai_ingestion_review.sql",
  "0009_phase17_18_4_ai_generation.sql",
  "0010_phase17_19_3_content_engine.sql",
];

const migration = (name: string) => read(`drizzle/migrations/${name}`);

describe("Phase 17.19.12 recovery readiness contracts", () => {
  it("keeps the actual migration manifest complete and ordered", () => {
    expect(migrations.every((name) => manifest.includes(`\"${name}\"`))).toBe(true);
    const positions = migrations.map((name) => manifest.indexOf(name));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("captures the structural dependency graph in the recovery evidence", () => {
    expect(migrationGraph).toContain("0008 → 0009");
    expect(migrationGraph).toContain("0001 + 0004 + 0005 + 0007 → 0010");
    expect(migrationGraph).toContain("SOURCE_EXISTS = VERIFIED");
  });

  it("detects the runtime-critical person_media object in source", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS person_media");
    expect(sql).toContain("person_media_primary_portrait_unique");
    expect(schema).toContain('"person_media"');
  });

  it("keeps migration classification conservative for constraint changes", () => {
    expect(migrationGraph).toContain("0006 site experience");
    expect(migrationGraph).toContain("POTENTIALLY_DESTRUCTIVE");
    expect(migrationGraph).toContain("DESTRUCTIVE_CHANGE_REQUIRES_EXPLICIT_APPROVAL");
  });

  it("blocks destructive bypass flags in the native runner", () => {
    expect(runner).not.toMatch(/--force|--reset|--skip-checks/);
    expect(recovery).toContain("drizzle-kit push");
    expect(recovery).toContain("لا تستخدم");
  });

  it("enforces first-pending migration ordering", () => {
    expect(runner).toContain("findIndex((version) => !applied.has(version))");
    expect(runner).toContain("MIGRATION_VERSIONS.slice(firstPendingIndex + 1)");
    expect(runner).toContain("firstPendingIndex < 3");
  });

  it("fails closed on inconsistent or changed migration state", () => {
    expect(runner).toContain("MigrationRegistryInconsistentError");
    expect(runner).toContain("MigrationStateChangedError");
    expect(runner).toContain("MigrationPrerequisiteError");
  });

  it("uses a transaction and advisory lock for native migration execution", () => {
    expect(runner).toContain("await sql.begin(async (transaction)");
    expect(runner).toContain("pg_advisory_xact_lock");
    expect(runner).toContain("transaction.unsafe(migration)");
  });

  it("records migration history only after the migration statement", () => {
    expect(runner.indexOf("transaction.unsafe(migration)")).toBeLessThan(runner.indexOf("INSERT INTO schema_migrations"));
    expect(runner).toContain("CREATE TABLE IF NOT EXISTS schema_migrations");
  });

  it("requires explicit backup, isolation, compatibility, and authorization gates", () => {
    expect(recovery).toContain("BACKUP_STATUS");
    expect(recovery).toContain("ISOLATED_REHEARSAL");
    expect(recovery).toContain("DATA_COMPATIBILITY");
    expect(recovery).toContain("REQUIRES_AUTHORIZATION");
  });

  it("keeps rollback explicitly plan-only until tested evidence exists", () => {
    expect(recovery).toContain("ROLLBACK_STATUS = PLAN_ONLY");
    expect(recovery).toContain("provider-approved restore");
    expect(recovery).not.toContain("ROLLBACK_STATUS = TESTED");
  });

  it("records the absence of safe Production schema access truthfully", () => {
    expect(baseline).toContain("Production PostgreSQL read-only channel | NOT_AVAILABLE");
    expect(baseline).toContain("`schema_migrations` access | NOT_OBSERVABLE");
    expect(baseline).toContain("Backup/snapshot evidence | NOT_CONFIRMED");
  });

  it("keeps the homepage on the real database-backed repository", () => {
    expect(personService).toContain("databaseRepository");
    expect(personService).not.toContain("localRepository");
    expect(page).toContain("personService.listCategories()");
    expect(page).toContain("personService.listPublishedPeople()");
  });

  it("preserves truthful unavailable behavior instead of fake catalog fallback", () => {
    expect(page).toContain("dataUnavailable");
    expect(page).toContain("copy.dataUnavailable");
    expect(page).not.toContain("samplePeople");
    expect(page).not.toContain("ibn-khaldun");
  });

  it("keeps published-only validation before public person output", () => {
    expect(repository).toContain("validatePublishedRecord(record)");
    expect(repository).toContain("publishedOnly");
    expect(personService).toContain("getPublishedPersonBySlug");
    expect(personRoute).toContain("if (!record) notFound()");
  });

  it("keeps the observed Person route media dependency explicit", () => {
    expect(personRoute).toContain("getPersonMedia");
    expect(media).toContain("from(schema.personMedia)");
    expect(media).toContain("innerJoin(schema.mediaAssets");
    expect(media).toContain("code === \"42P01\"");
  });

  it("requires ready and public media for public portrait projection", () => {
    expect(media).toContain("mediaAssets.status, \"ready\"");
    expect(media).toContain("mediaAssets.visibility, \"public\"");
    expect(personRoute).toContain("getSafePublicImageUrl");
  });

  it("does not expose storage keys through the public Person rendering path", () => {
    expect(personRoute).toContain("getSafePublicImageUrl");
    expect(personRoute).not.toContain("storageKey");
    expect(personRoute).not.toContain("provider");
  });

  it("keeps AI production and publication disabled", () => {
    expect(activation).toMatch(/AI_PRODUCTION_ENABLED\s*=\s*false/);
    expect(activation).toMatch(/AI_PUBLICATION_ENABLED\s*=\s*false/);
    expect(recovery).toContain("AI/provider/OCR/upload");
  });

  it("keeps Population and automatic entity creation outside recovery", () => {
    expect(recovery.toLowerCase()).toContain("population");
    expect(recovery).toContain("لم تُنفذ أي Production migration أو DDL أو DML");
    expect(recovery).toContain("seed/population/backfill");
    expect(page).not.toContain("createPersonRecord");
    expect(personRoute).not.toContain("createProfile");
  });

  it("keeps CMS claims separated between code, schema, persistence, auth, and browser", () => {
    expect(recovery).toContain("CMS_CODE");
    expect(recovery).toContain("CMS_SCHEMA");
    expect(recovery).toContain("CMS_PERSISTENCE");
    expect(recovery).toContain("CMS_BROWSER");
  });

  it("records the current state as blocked rather than successful recovery", () => {
    expect(baseline).toContain("PRODUCTION_RECOVERY = NOT_STARTED");
    expect(recovery).toContain("PRODUCTION_RECOVERY_GATE = REQUIRES_AUTHORIZATION");
    expect(recovery).toContain("DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION");
  });
});
