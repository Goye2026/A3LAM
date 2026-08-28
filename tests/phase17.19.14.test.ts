import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = (name: string) => read(`drizzle/migrations/${name}`);

const manifest = read("lib/db/migrations/manifest.mjs");
const runner = read("lib/db/migrations/runner.mjs");
const schema = read("lib/db/schema.ts");
const repository = read("lib/data/databaseRepository.ts");
const personService = read("lib/services/personService.ts");
const homepage = read("app/page.tsx");
const personRoute = read("app/person/[slug]/page.tsx");
const mediaRepository = read("lib/media/repository.ts");
const activation = read("lib/ai/activation.ts");
const adminHttp = read("lib/admin/http.ts");
const requestSecurity = read("lib/user/requestSecurity.ts");
const cmsApi = read("app/api/admin/cms/pages/route.ts");
const revision = read("components/a3lam/CmsRevisionCenter.tsx");
const baseline = read("docs/PHASE_17_19_14_BASELINE.md");
const inventory = read("docs/PHASE_17_19_14_PRODUCTION_SCHEMA_INVENTORY.md");
const execution = read("docs/PHASE_17_19_14_MIGRATION_EXECUTION.md");
const integrity = read("docs/PHASE_17_19_14_DATA_INTEGRITY.md");
const homepageRecovery = read("docs/PHASE_17_19_14_HOMEPAGE_RECOVERY.md");
const personRecovery = read("docs/PHASE_17_19_14_PERSON_ROUTE_RECOVERY.md");
const finalStatus = read("docs/PHASE_17_19_14_FINAL_STATUS.md");
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

describe("Phase 17.19.14 controlled recovery contracts", () => {
  it("keeps all repository migrations in canonical manifest order", () => {
    const positions = migrations.map((name) => manifest.indexOf(name));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("keeps 0007 as the source of media_assets and person_media", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS person_media");
    expect(sql).toContain("REFERENCES people(id)");
    expect(sql).toContain("REFERENCES media_assets(id)");
    expect(schema).toContain('"person_media"');
    expect(schema).toContain('"media_assets"');
  });

  it("keeps media indexes and primary portrait uniqueness in source", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql");
    expect(sql).toContain("person_media_primary_portrait_unique");
    expect(schema).toContain("person_media_asset_idx");
    expect(schema).toContain("person_media_person_idx");
    expect(mediaRepository).toContain("publicOnly");
  });

  it("keeps Homepage on the real database-backed repositories", () => {
    expect(personService).toContain("databaseRepository");
    expect(personService).not.toContain("localRepository");
    expect(homepage).toContain("personService.listCategories()");
    expect(homepage).toContain("personService.listPublishedPeople()");
  });

  it("keeps Homepage unavailable and empty states truthful", () => {
    expect(homepage).toContain("dataUnavailable");
    expect(homepage).toContain("copy.dataUnavailable");
    expect(homepage).not.toContain("samplePeople");
    expect(homepage).not.toContain("ibn-khaldun");
    expect(homepageRecovery).toContain("REAL_PERSON_VISIBLE_ON_HOMEPAGE = NOT_VERIFIED");
  });

  it("filters public categories and people through publication state and validation", () => {
    expect(repository).toContain("schema.categories.status, \"published\"");
    expect(repository).toContain("schema.people.status, \"published\"");
    expect(repository).toContain("validatePublishedRecord(record)");
    expect(personService).toContain("getPublishedPersonBySlug");
  });

  it("traces Person route dependencies without a hardcoded fallback", () => {
    expect(personRoute).toContain("getUnlistedOrPublishedProfileBySlug");
    expect(personRoute).toContain("personService.getPublishedPersonBySlug");
    expect(personRoute).toContain("getPersonMedia");
    expect(personRoute).toContain("getSafePublicImageUrl");
    expect(personRoute).not.toContain("Ibn Khaldun fallback");
    expect(personRecovery).toContain("OBSERVED FAILURE");
  });

  it("requires ready/public media for public portrait selection", () => {
    expect(mediaRepository).toContain('mediaAssets.status, "ready"');
    expect(mediaRepository).toContain('mediaAssets.visibility, "public"');
    expect(personRoute).not.toContain("storageKey");
  });

  it("keeps CMS routes behind the existing protected API boundary", () => {
    expect(cmsApi).toContain("requirePermissionPrincipal");
    expect(cmsApi).toContain("editorialRepository");
    expect(adminHttp).toContain("requirePermissionPrincipal");
  });

  it("preserves revision expected-version and conflict behavior", () => {
    expect(revision).toContain("expectedVersion: currentVersion");
    expect(revision).toContain("response.status === 409");
    expect(revision).toContain('role="alert"');
    expect(revision).toContain('role="status"');
  });

  it("preserves same-origin and authentication/RBAC protections", () => {
    expect(requestSecurity).toContain("isSameOriginMutation");
    expect(requestSecurity).toContain("origin");
    expect(adminHttp).toContain("requirePermissionPrincipal");
  });

  it("keeps AI production and publication disabled", () => {
    expect(activation).toMatch(/AI_PRODUCTION_ENABLED\s*=\s*false/);
    expect(activation).toMatch(/AI_PUBLICATION_ENABLED\s*=\s*false/);
    expect(finalStatus).toContain("AI = DISABLED");
  });

  it("keeps migration execution unperformed and history untouched", () => {
    expect(execution).toContain("MIGRATION_EXECUTION = NOT EXECUTED");
    expect(execution).toContain("schema_migrations");
    expect(execution).toContain("لم تُنشأ جداول يدويًا");
    expect(execution).toContain("drizzle-kit push");
  });

  it("keeps the native runner fail-closed and ordered", () => {
    expect(runner).toContain("MigrationRegistryInconsistentError");
    expect(runner).toContain("MigrationPrerequisiteError");
    expect(runner).toContain("MigrationStateChangedError");
    expect(runner).toContain("firstPendingIndex");
    expect(runner).toContain("pg_advisory_xact_lock");
  });

  it("records Production inventory uncertainty without inventing counts", () => {
    expect(inventory).toContain("PRODUCTION_SCHEMA_ACCESS = NOT_AVAILABLE");
    expect(inventory).toContain("UNKNOWN");
    expect(inventory).toContain("MISSING for observed query");
    expect(integrity).toContain("DATA_INTEGRITY = NOT_OBSERVABLE");
    expect(integrity).toContain("TABLE_NOT_PRESENT");
  });

  it("records the unavailable isolated rehearsal truthfully", () => {
    expect(finalStatus).toContain("safe isolated PostgreSQL unavailable");
    expect(execution).toContain("MIGRATION_EXECUTION = NOT EXECUTED");
  });

  it("records that the isolated integration suite was not run", () => {
    expect(finalStatus).toContain("pnpm test:integration");
    expect(finalStatus).toContain("NOT RUN — safe isolated PostgreSQL unavailable");
  });

  it("requires authorization, backup, observability, and rollback gates", () => {
    expect(baseline).toContain("NOT_CONFIRMED");
    expect(baseline).toContain("NOT_OBSERVABLE");
    expect(baseline).toContain("valid Production PostgreSQL access");
    expect(baseline).toContain("recoverable backup/snapshot evidence");
    expect(baseline).toContain("explicit schema-recovery authorization");
  });

  it("keeps data integrity and CMS persistence unverified instead of overstating success", () => {
    expect(integrity).toContain("DATA_INTEGRITY = NOT_OBSERVABLE");
    expect(finalStatus).toContain("`CMS = NOT VERIFIED / BLOCKED`");
    expect(finalStatus).toContain("HTTP 200 وحده ليس Functional PASS");
  });

  it("keeps all prohibited activity at zero or not started", () => {
    expect(finalStatus).toContain("Production writes | 0");
    expect(finalStatus).toContain("Migrations executed | 0");
    expect(finalStatus).toContain("POPULATION = NOT_STARTED");
    expect(finalStatus).toContain("AI = DISABLED");
    expect(finalStatus).toContain("STOP AFTER PHASE 17.19.14.");
  });
});
