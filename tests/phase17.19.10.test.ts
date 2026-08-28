import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MIGRATION_VERSIONS } from "@/lib/db/migrations/manifest.mjs";
import { compareMigrationRegistry } from "@/lib/admin/migrationRegistry";

const root = resolve(process.cwd());
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

function migration(name: string) {
  return source(`drizzle/migrations/${name}`);
}

describe("Phase 17.19.10 schema forensics contracts", () => {
  it("keeps the repository migration manifest ordered through 0010", () => {
    expect(MIGRATION_VERSIONS).toEqual([
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
    ]);
  });

  it("classifies pending and unexpected registry rows without claiming Production state", () => {
    const status = compareMigrationRegistry([...MIGRATION_VERSIONS], [
      { version: "0001_a3lam_core.sql", appliedAt: "2026-01-01T00:00:00.000Z" },
      { version: "unexpected.sql", appliedAt: null },
    ]);
    expect(status.status).toBe("inconsistent");
    expect(status.items.find((item) => item.version === "0007_phase17_16_media_architecture.sql")?.state).toBe("PENDING");
    expect(status.items.find((item) => item.version === "unexpected.sql")?.state).toBe("UNEXPECTED");
  });

  it("defines the media tables, foreign keys, primary key, and safety constraints in 0007", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS person_media");
    expect(sql).toContain("person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE");
    expect(sql).toContain("media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT");
    expect(sql).toContain("PRIMARY KEY (person_id, media_asset_id, usage_type)");
    expect(sql).toContain("person_media_primary_portrait_unique");
  });

  it("keeps 0007 structural-only with no row-level data operations", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql");
    expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|MERGE|UPSERT|TRUNCATE)\b/im);
    expect(sql).toContain("CREATE UNIQUE INDEX");
  });

  it("keeps 0008 dependent on admin RBAC and explicit ingestion status checks", () => {
    const sql = migration("0008_phase17_18_2_ai_ingestion_review.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS ai_documents");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS ai_extracted_facts");
    expect(sql).toContain("REFERENCES admin_identities(id)");
    expect(sql).toContain("ai_documents_ingestion_status_check");
    expect(sql).toContain("ai.documents.create");
    expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|MERGE|UPSERT|TRUNCATE)\b/im);
  });

  it("keeps 0009 rooted in 0008 documents and human-review claims", () => {
    const sql = migration("0009_phase17_18_4_ai_generation.sql");
    expect(sql).toContain("document_id TEXT NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS ai_generation_claims");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS ai_generation_review_decisions");
    expect(sql).toContain("ai.generation.create");
    expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|MERGE|UPSERT|TRUNCATE)\b/im);
  });

  it("keeps 0010 CMS tables and publication/version constraints explicit", () => {
    const sql = migration("0010_phase17_19_3_content_engine.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS cms_pages");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS cms_posts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS cms_tags");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS cms_content_revisions");
    expect(sql).toContain("cms_pages_published_at_check");
    expect(sql).toContain("cms_content_revisions_owner_check");
    expect(sql).toContain("featured_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT");
  });

  it("keeps CMS taxonomy and revision relationships normalized", () => {
    const sql = migration("0010_phase17_19_3_content_engine.sql");
    expect(sql).toContain("post_id TEXT NOT NULL REFERENCES cms_posts(id) ON DELETE CASCADE");
    expect(sql).toContain("category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT");
    expect(sql).toContain("tag_id TEXT NOT NULL REFERENCES cms_tags(id) ON DELETE RESTRICT");
    expect(sql).toContain("cms_content_revisions_page_version_unique");
    expect(sql).toContain("cms_content_revisions_post_version_unique");
  });

  it("shows that later permission migrations replace a constraint rather than write rows", () => {
    for (const name of ["0008_phase17_18_2_ai_ingestion_review.sql", "0009_phase17_18_4_ai_generation.sql", "0010_phase17_19_3_content_engine.sql"]) {
      const sql = migration(name);
      expect(sql).toContain("DROP CONSTRAINT IF EXISTS admin_permission_overrides_code_check");
      expect(sql).toContain("ADD CONSTRAINT admin_permission_overrides_code_check CHECK");
      expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|MERGE|UPSERT|TRUNCATE)\b/im);
    }
  });

  it("keeps runner ordering and prerequisite gate explicit", () => {
    const runner = source("lib/db/migrations/runner.mjs");
    expect(runner).toContain("firstPendingIndex");
    expect(runner).toContain("firstPendingIndex < 3");
    expect(runner).toContain("MigrationPrerequisiteError");
    expect(runner).toContain("MigrationRegistryInconsistentError");
  });

  it("keeps migration observability conservative when schema_migrations is unavailable", () => {
    const registry = source("lib/admin/migrationRegistry.ts");
    expect(registry).toContain('status: "unavailable"');
    expect(registry).toContain("to_regclass('public.schema_migrations')");
    expect(registry).toContain("return { status: \"unavailable\"");
    expect(registry).toContain('"REGISTRY_UNAVAILABLE"');
  });

  it("documents the homepage database failure boundary without local fallback", () => {
    const page = source("app/page.tsx");
    const service = source("lib/services/personService.ts");
    expect(page).toContain("personService.listPublishedPeople()");
    expect(page).toContain("dataUnavailable = true");
    expect(service).toContain("return databaseRepository.listPublishedPeople()");
    expect(page).not.toContain("localRepository");
  });

  it("documents the public person media relation dependency", () => {
    const route = source("app/person/[slug]/page.tsx");
    const media = source("lib/media/repository.ts");
    expect(route).toContain("getPersonMedia");
    expect(media).toContain("schema.personMedia");
    expect(media).toContain("schema.mediaAssets");
    expect(media).toContain("MediaSchemaUnavailableError");
  });

  it("keeps the public publication firewall in source", () => {
    const repository = source("lib/data/databaseRepository.ts");
    const domain = source("lib/domain/a3lam.ts");
    expect(repository).toContain("validatePublishedRecord");
    expect(domain).toContain('record.person.status !== "published"');
    expect(domain).toContain("Published people require published categories");
    expect(domain).toContain("Published people require published sources");
  });

});
