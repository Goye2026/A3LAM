import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const manifest = read("lib/db/migrations/manifest.mjs");
const schema = read("lib/db/schema.ts");
const page = read("app/page.tsx");
const personRoute = read("app/person/[slug]/page.tsx");
const personService = read("lib/services/personService.ts");
const repository = read("lib/data/databaseRepository.ts");
const media = read("lib/media/repository.ts");
const activation = read("lib/ai/activation.ts");
const adminHttp = read("lib/admin/http.ts");
const requestSecurity = read("lib/user/requestSecurity.ts");
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

function migration(path: string) {
  return read(`drizzle/migrations/${path}`);
}

describe("Phase 17.19.11 schema-recovery forensic contracts", () => {
  it("keeps the complete source migration manifest ordered", () => {
    expect(manifest).toContain("export const MIGRATION_VERSIONS");
    expect(migrations.every((name) => manifest.includes(`\"${name}\"`))).toBe(true);
    expect(migrations.map((name) => manifest.indexOf(name))).toEqual([...migrations].map((name) => manifest.indexOf(name)).sort((a, b) => a - b));
  });

  it("contains every manifest migration in source", () => {
    for (const name of migrations) expect(() => migration(name)).not.toThrow();
  });

  it("defines the core person/category/source relationships in schema", () => {
    expect(schema).toContain("export const people");
    expect(schema).toContain("export const categories");
    expect(schema).toContain("export const personCategories");
    expect(schema).toContain("export const sources");
    expect(schema).toContain("export const personSources");
  });

  it("defines media assets and person media as separate schema objects", () => {
    expect(schema).toContain("export const mediaAssets");
    expect(schema).toContain("export const personMedia");
    expect(migration("0007_phase17_16_media_architecture.sql")).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(migration("0007_phase17_16_media_architecture.sql")).toContain("CREATE TABLE IF NOT EXISTS person_media");
  });

  it("classifies the observed person_media dependency as a real query dependency", () => {
    expect(repository).toContain("schema.personMedia");
    expect(media).toContain("from(schema.personMedia)");
    expect(media).toContain("innerJoin(schema.mediaAssets");
    expect(personRoute).toContain("getPersonMedia");
  });

  it("keeps the observed missing-media relation an explicit typed failure boundary", () => {
    expect(media).toContain("MediaSchemaUnavailableError");
    expect(media).toContain("code === \"42P01\"");
    expect(media).toContain("throw new MediaSchemaUnavailableError");
  });

  it("preserves the homepage real repository pipeline", () => {
    expect(personService).toContain("databaseRepository");
    expect(personService).not.toContain("localRepository");
    expect(page).toContain("personService.listCategories()");
    expect(page).toContain("personService.listPublishedPeople()");
    expect(page).toContain("toDisplayPeople");
  });

  it("does not turn an unavailable catalog into fake cards or fake counts", () => {
    expect(page).toContain("dataUnavailable");
    expect(page).toContain("copy.dataUnavailable");
    expect(page).toContain("people.length");
    expect(page).not.toContain("ibn-khaldun");
    expect(page).not.toContain("samplePeople");
  });

  it("keeps published-person validation before public person projection", () => {
    expect(repository).toContain("validatePublishedRecord(record)");
    expect(repository).toContain("publishedOnly");
    expect(repository).toContain("status");
    expect(personService).toContain("getPublishedPersonBySlug");
  });

  it("keeps the public person route profile fallback separate from editorial people", () => {
    expect(personRoute).toContain("getUnlistedOrPublishedProfileBySlug");
    expect(personRoute).toContain("personService.getPublishedPersonBySlug");
    expect(personRoute).toContain("if (!record) notFound()");
    expect(personRoute).toContain("getSafePublicImageUrl");
  });

  it("keeps CMS persistence behind the existing editorial repository contract", () => {
    const pagesApi = read("app/api/admin/cms/pages/route.ts");
    const pagesEditor = read("app/admin/(protected)/content/pages/page.tsx");
    expect(pagesApi).toContain("editorialRepository");
    expect(pagesApi).toContain("requirePermissionPrincipal");
    expect(pagesEditor).toContain("editorialRepository.list");
    expect(migration("0010_phase17_19_3_content_engine.sql")).toContain("CREATE TABLE IF NOT EXISTS cms_pages");
  });

  it("keeps migration execution out of public and forensic test paths", () => {
    expect(page).not.toContain("runMigrations");
    expect(personRoute).not.toContain("runMigrations");
  });

  it("keeps the AI production boundary disabled in source", () => {
    expect(activation).toMatch(/AI_PRODUCTION_ENABLED\s*=\s*false/);
    expect(activation).toMatch(/AI_PUBLICATION_ENABLED\s*=\s*false/);
    expect(activation).toContain("AI_PROCESSING_ENABLED");
  });

  it("keeps admin authorization server-side and mutation origin-protected", () => {
    expect(adminHttp).toContain("requirePermissionPrincipal");
    expect(requestSecurity).toContain("isSameOriginMutation");
    expect(requestSecurity).toContain("origin");
  });

  it("keeps public media projection bounded to ready/public assets", () => {
    expect(media).toContain("mediaAssets.status, \"ready\"");
    expect(media).toContain("mediaAssets.visibility, \"public\"");
    expect(media).toContain("publicOnly");
    expect(personRoute).toContain("getSafePublicImageUrl");
  });

  it("keeps migration 0007 structural and free of row-level writes", () => {
    const sql = migration("0007_phase17_16_media_architecture.sql").toUpperCase();
    expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|TRUNCATE)\s+/m);
    expect(sql).toContain("REFERENCES");
    expect(sql).toContain("CREATE INDEX");
  });

  it("records constraint-replacement risk in later migrations without treating it as data repair", () => {
    for (const name of ["0008_phase17_18_2_ai_ingestion_review.sql", "0009_phase17_18_4_ai_generation.sql", "0010_phase17_19_3_content_engine.sql"]) {
      const sql = migration(name).toUpperCase();
      expect(sql).toContain("DROP CONSTRAINT");
      expect(sql).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|TRUNCATE)\s+/m);
    }
  });

  it("does not create Person or Profile records automatically", () => {
    expect(page).not.toContain("createPersonRecord");
    expect(personRoute).not.toContain("createPersonRecord");
    expect(personRoute).not.toContain("createProfile");
    expect(activation).not.toContain("createPerson");
    expect(activation).not.toContain("createProfile");
  });
});
