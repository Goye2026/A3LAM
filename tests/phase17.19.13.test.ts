import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = (name: string) => read(`drizzle/migrations/${name}`);

const manifest = read("lib/db/migrations/manifest.mjs");
const runner = read("lib/db/migrations/runner.mjs");
const schema = read("lib/db/schema.ts");
const homepage = read("app/page.tsx");
const personRoute = read("app/person/[slug]/page.tsx");
const personService = read("lib/services/personService.ts");
const repository = read("lib/data/databaseRepository.ts");
const mediaRepository = read("lib/media/repository.ts");
const activation = read("lib/ai/activation.ts");
const adminHttp = read("lib/admin/http.ts");
const requestSecurity = read("lib/user/requestSecurity.ts");
const cmsPagesApi = read("app/api/admin/cms/pages/route.ts");
const revision = read("components/a3lam/CmsRevisionCenter.tsx");
const baseline = read("docs/PHASE_17_19_13_BASELINE.md");
const migrationAudit = read("docs/PHASE_17_19_13_MIGRATION_AUDIT.md");
const homepageAudit = read("docs/PHASE_17_19_13_HOMEPAGE_DEPENDENCY_AUDIT.md");
const rehearsal = read("docs/PHASE_17_19_13_ISOLATED_REHEARSAL.md");
const recovery = read("docs/PHASE_17_19_13_RECOVERY_PLAN.md");

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

describe("Phase 17.19.13 forensic and recovery contracts", () => {
  it("keeps the complete migration chain in canonical order", () => {
    const positions = migrations.map((name) => manifest.indexOf(name));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("preserves structural dependencies across the chain", () => {
    expect(migration("0007_phase17_16_media_architecture.sql")).toContain("person_media");
    expect(migration("0008_phase17_18_2_ai_ingestion_review.sql")).toContain("ai_documents");
    expect(migration("0009_phase17_18_4_ai_generation.sql")).toContain("ai_documents");
    expect(migration("0010_phase17_19_3_content_engine.sql")).toContain("media_assets");
  });

  it("defines both media relations required by the public projection", () => {
    const mediaMigration = migration("0007_phase17_16_media_architecture.sql");
    expect(mediaMigration).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(mediaMigration).toContain("CREATE TABLE IF NOT EXISTS person_media");
    expect(schema).toContain('"person_media"');
    expect(schema).toContain('"media_assets"');
  });

  it("keeps person_media foreign-key and primary-portrait safety contracts", () => {
    const mediaMigration = migration("0007_phase17_16_media_architecture.sql");
    expect(mediaMigration).toContain("REFERENCES people(id)");
    expect(mediaMigration).toContain("REFERENCES media_assets(id)");
    expect(mediaMigration).toContain("person_media_primary_portrait_unique");
    expect(schema).toContain("person_media_asset_idx");
    expect(schema).toContain("person_media_person_idx");
  });

  it("keeps Homepage on the real database-backed catalog", () => {
    expect(personService).toContain("databaseRepository");
    expect(personService).not.toContain("localRepository");
    expect(homepage).toContain("personService.listCategories()");
    expect(homepage).toContain("personService.listPublishedPeople()");
  });

  it("uses an honest unavailable state instead of fake catalog data", () => {
    expect(homepage).toContain("dataUnavailable");
    expect(homepage).toContain("copy.dataUnavailable");
    expect(homepage).not.toContain("samplePeople");
    expect(homepage).not.toContain("ibn-khaldun");
  });

  it("keeps public people and categories behind published validation", () => {
    expect(repository).toContain("schema.people.status, \"published\"");
    expect(repository).toContain("validatePublishedRecord(record)");
    expect(repository).toContain("schema.categories.status, \"published\"");
    expect(personRoute).toContain("personService.getPublishedPersonBySlug");
    expect(personRoute).toContain("if (!record) notFound()");
  });

  it("traces the Person route through profile fallback, media, and public projection", () => {
    expect(personRoute).toContain("getUnlistedOrPublishedProfileBySlug");
    expect(personRoute).toContain("getPersonMedia");
    expect(personRoute).toContain("getSafePublicImageUrl");
    expect(personRoute).toContain("serializeJsonLd");
  });

  it("requires ready/public media and safe URLs for public portrait use", () => {
    expect(mediaRepository).toContain("mediaAssets.status, \"ready\"");
    expect(mediaRepository).toContain("mediaAssets.visibility, \"public\"");
    expect(mediaRepository).toContain("publicUrl");
    expect(mediaRepository).toContain("publicOnly");
    expect(personRoute).not.toContain("storageKey");
  });

  it("keeps CMS writes behind the protected repository/API contract", () => {
    expect(cmsPagesApi).toContain("requirePermissionPrincipal");
    expect(cmsPagesApi).toContain("editorialRepository");
    expect(read("app/api/admin/cms/pages/[id]/route.ts")).toContain("requirePermissionPrincipal");
    expect(adminHttp).toContain("requirePermissionPrincipal");
  });

  it("preserves revision stale-version protection and accessible states", () => {
    expect(revision).toContain("expectedVersion: currentVersion");
    expect(revision).toContain("response.status === 409");
    expect(revision).toContain('role="alert"');
    expect(revision).toContain('role="status"');
  });

  it("preserves authentication, RBAC, and same-origin enforcement", () => {
    expect(requestSecurity).toContain("isSameOriginMutation");
    expect(requestSecurity).toContain("origin");
    expect(adminHttp).toContain("requirePermissionPrincipal");
  });

  it("keeps AI production and publication disabled", () => {
    expect(activation).toMatch(/AI_PRODUCTION_ENABLED\s*=\s*false/);
    expect(activation).toMatch(/AI_PUBLICATION_ENABLED\s*=\s*false/);
  });

  it("keeps population, seed, uploads, and automatic entity creation outside recovery", () => {
    expect(recovery).toContain("Never seed or populate Production");
    expect(recovery).toContain("create People/Profiles/Users");
    expect(recovery).toContain("upload media");
    expect(homepage).not.toContain("createPersonRecord");
    expect(personRoute).not.toContain("createProfile");
  });

  it("keeps the native migration runner fail-closed and ordered", () => {
    expect(runner).toContain("MigrationRegistryInconsistentError");
    expect(runner).toContain("MigrationPrerequisiteError");
    expect(runner).toContain("MigrationStateChangedError");
    expect(runner).toContain("firstPendingIndex");
    expect(runner).toContain("pg_advisory_xact_lock");
  });

  it("records that isolated rehearsal is not available rather than faking a pass", () => {
    expect(rehearsal).toContain("ISOLATED_REHEARSAL = NOT_AVAILABLE");
    expect(rehearsal).toContain("isolated database");
    expect(rehearsal).toContain("لم تُطبق migrations");
  });

  it("records Production observability limits and truthful baseline states", () => {
    expect(baseline).toContain("schema_migrations");
    expect(baseline).toContain("NOT_OBSERVABLE");
    expect(baseline).toContain("AI_PRODUCTION_ENABLED = false");
    expect(baseline).toContain("Historical Production totals are **NOT_OBSERVABLE**");
  });

  it("documents the Homepage dependency audit without declaring an empty database", () => {
    expect(homepageAudit).toContain("It is invalid to state that cards are absent because the database is empty");
    expect(homepageAudit).toContain("HOMEPAGE_STATUS = DEGRADED / NOT VERIFIED AS RESTORED");
    expect(migrationAudit).toContain("PRODUCTION_MIGRATION_HISTORY = NOT_OBSERVABLE");
  });

  it("requires every recovery gate before Production DDL", () => {
    expect(recovery).toContain("EXPLICIT_AUTHORIZATION");
    expect(recovery).toContain("BACKUP_STATUS");
    expect(recovery).toContain("ISOLATED_REHEARSAL");
    expect(recovery).toContain("SCHEMA_COMPATIBILITY");
    expect(recovery).toContain("ROLLBACK_PLAN");
    expect(recovery).toContain("PRODUCTION_RECOVERY = BLOCKED");
  });

  it("keeps rollback plan-only and prohibits shortcuts", () => {
    expect(recovery).toContain("ROLLBACK_PLAN = PLAN_ONLY");
    expect(recovery).toContain("drizzle-kit push");
    expect(recovery).toContain("manual migration-history manipulation");
    expect(recovery).toContain("DO NOT EXECUTE WITHOUT EXPLICIT AUTHORIZATION");
  });
});
