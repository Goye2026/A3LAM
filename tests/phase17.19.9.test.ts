import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { toDisplayPeople } from "@/lib/a3lam/catalog";
import { getSafePublicImageUrl } from "@/lib/media/public";
import type { Category, Person } from "@/lib/domain/a3lam";

const root = resolve(process.cwd());
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

const publishedCategory: Category = {
  id: "history",
  slug: "history",
  name: "التاريخ",
  description: "شخصيات تاريخية عربية موثقة.",
  status: "published",
};

const publishedPerson: Person = {
  id: "person-1",
  slug: "person-one",
  name: "Person One",
  nameArabic: "شخصية أولى",
  shortBio: "نبذة منشورة.",
  biography: "سيرة منشورة.",
  birthDate: null,
  deathDate: null,
  birthPlace: null,
  deathPlace: null,
  categoryIds: [publishedCategory.id],
  occupations: ["مؤرخ"],
  image: "https://example.com/person.webp",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  timelineEventIds: [],
  educationIds: [],
  sourceIds: ["source-1"],
};

describe("Phase 17.19.9 functional reality regression contracts", () => {
  it("keeps homepage on the real server repository path", () => {
    const page = source("app/page.tsx");
    expect(page).toContain("personService.listCategories()");
    expect(page).toContain("personService.listPublishedPeople()");
    expect(page).toContain("withTimeout(");
    expect(page).not.toContain("localRepository");
    expect(page).not.toMatch(/mockPersons|demoPersons|samplePosts|fakePages/);
  });

  it("keeps the homepage honest when the real catalog read fails", () => {
    const page = source("app/page.tsx");
    expect(page).toContain("dataUnavailable = true");
    expect(page).toContain("copy.dataUnavailable");
    expect(page).toContain('role={alert ? "alert" : "status"}');
  });

  it("maps a real published person into a stable display projection", () => {
    const projection = toDisplayPeople([publishedPerson], [publishedCategory]);
    expect(projection).toEqual([expect.objectContaining({
      id: "person-1",
      slug: "person-one",
      name: "شخصية أولى",
      role: "التاريخ",
      status: "published",
      image: "https://example.com/person.webp",
    })]);
  });

  it("does not manufacture a public image from an unsafe URL", () => {
    expect(getSafePublicImageUrl("javascript:alert(1)")).toBeNull();
    expect(getSafePublicImageUrl("https://example.com/image.webp")).toBe("https://example.com/image.webp");
  });

  it("keeps the database repository as the published people source and validates hydrated records", () => {
    const repository = source("lib/data/databaseRepository.ts");
    expect(repository).toContain('eq(schema.people.status, "published")');
    expect(repository).toContain("validatePublishedRecord(record)");
    expect(repository).toContain("orderBy(asc(schema.people.name))");
  });

  it("keeps search bounded and published-only", () => {
    const repository = source("lib/data/databaseRepository.ts");
    expect(repository).toContain("const PUBLIC_SEARCH_LIMIT = 100");
    expect(repository).toContain(".limit(PUBLIC_SEARCH_LIMIT)");
    expect(repository).toContain("return records.filter((record) => validatePublishedRecord(record).length === 0)");
  });

  it("keeps homepage data inside the active theme frame", () => {
    const page = source("app/page.tsx");
    expect(page).toContain('<SiteFrame copy={homepageCopy} footerCopy={publicCopy} active="home" template="index">');
    expect(page).toContain("<HomepageCatalogSections");
    expect(page).toContain("<PersonCard key={person.id} person={person}");
  });

  it("keeps person routes separate for professional profiles and editorial people", () => {
    const route = source("app/person/[slug]/page.tsx");
    expect(route).toContain("getUnlistedOrPublishedProfileBySlug(slug)");
    expect(route).toContain("personService.getPublishedPersonBySlug(slug)");
    expect(route).toContain("if (!record) notFound()");
  });

  it("keeps optional media migration failure from becoming a public data source", () => {
    const route = source("app/person/[slug]/page.tsx");
    const media = source("lib/media/repository.ts");
    expect(route).toContain("getPersonMedia");
    expect(route).toContain("legacy safe URL remains compatible");
    expect(media).toContain("MediaSchemaUnavailableError");
  });

  it("keeps public catalog routes published-only and server-side", () => {
    const categories = source("app/categories/page.tsx");
    const searchApi = source("app/api/search/route.ts");
    expect(categories).toContain("personService.listCategories()");
    expect(searchApi).toContain("personService.searchPublishedPeople");
    expect(searchApi).toContain("searchPublicProfiles");
    expect(searchApi).toContain("status: 503");
  });

  it("keeps unavailable CMS capabilities truthful instead of creating fake CRUD", () => {
    const registry = source("lib/cms/contentRegistry.ts");
    const pages = source("app/admin/(protected)/content/pages/page.tsx");
    expect(registry).toContain("requires_configuration");
    expect(pages).toContain("adminRequiresSchema");
    expect(pages).not.toMatch(/mockPages|fakePages|demoPages/);
  });

  it("keeps the required production safety boundaries present", () => {
    const activation = source("lib/ai/activation.ts");
    const migration = source("lib/admin/migrationExecution.ts");
    expect(activation).toContain("AI_PRODUCTION_ENABLED = false");
    expect(activation).toContain("AI_PUBLICATION_ENABLED = false");
    expect(migration).toContain("isMigrationExecutionConfirmation");
    expect(source("app/api/admin/system/migrations/execute/route.ts")).toContain("requirePermissionPrincipal");
  });
});
