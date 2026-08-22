import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { databaseRepository } from "@/lib/data/databaseRepository";
import { personService } from "@/lib/services/personService";
import type { Category, Person, PersonRecord } from "@/lib/domain/a3lam";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database.integration.test.ts; no integration result is claimed without PostgreSQL.");
}

const integrationPersonId = "dev-integration-created-person";

const developmentCategory: Category = {
  id: "science",
  slug: "science-technology",
  name: "العلوم والتقنية",
  description: "تصنيف تطويري لاختبار المنصة.",
  status: "published",
};

function draftRecord(): PersonRecord {
  const person: Person = {
    id: integrationPersonId,
    slug: "dev-integration-created-person",
    name: "سجل اختبار تكاملي",
    nameArabic: "سجل اختبار تكاملي",
    shortBio: "سجل اصطناعي لاختبار persistence.",
    biography: "هذا سجل اختبار اصطناعي لا يمثل شخصًا حقيقيًا.",
    birthDate: null,
    deathDate: null,
    birthPlace: null,
    deathPlace: null,
    categoryIds: [developmentCategory.id],
    occupations: ["اختبار التكامل"],
    image: null,
    status: "draft",
    createdAt: "2026-08-22T00:00:00.000Z",
    updatedAt: "2026-08-22T00:00:00.000Z",
    timelineEventIds: [],
    educationIds: [],
    sourceIds: [],
  };
  return {
    person,
    categories: [developmentCategory],
    timeline: [],
    education: [],
    sources: [],
  };
}

afterAll(async () => {
  const db = getDb();
  await db.delete(schema.people).where(eq(schema.people.id, integrationPersonId));
});

describe("PostgreSQL persistence and relations", () => {
  it("loads categories and the seeded published record with source, timeline, and education relations", async () => {
    const categories = await databaseRepository.listCategories();
    expect(categories).toHaveLength(7);

    const record = await databaseRepository.getPublishedPersonBySlug("dev-published-test-profile");
    expect(record?.person.status).toBe("published");
    expect(record?.categories.map((item) => item.id)).toContain("science");
    expect(record?.sources.map((item) => item.id)).toContain("dev-source-published");
    expect(record?.timeline.map((item) => item.id)).toContain("dev-event-published");
    expect(record?.education.map((item) => item.id)).toContain("dev-education-published");
  });

  it("supports create/read/update lifecycle through the repository", async () => {
    const created = await databaseRepository.createPersonRecord(draftRecord());
    expect(created.person.status).toBe("draft");

    const read = await databaseRepository.getPersonBySlug("dev-integration-created-person");
    expect(read?.person.nameArabic).toBe("سجل اختبار تكاملي");

    const updated = await databaseRepository.updatePerson(integrationPersonId, { status: "review" });
    expect(updated?.person.status).toBe("review");
    expect(await databaseRepository.getPublishedPersonBySlug("dev-integration-created-person")).toBeNull();
  });
});

describe("PostgreSQL publication security and search", () => {
  it("includes only published records in public list and profile lookup", async () => {
    const people = await databaseRepository.listPublishedPeople();
    expect(people.map((person) => person.slug)).toContain("dev-published-test-profile");
    expect((await personService.getPublishedPersonBySlug("dev-published-test-profile"))?.person.slug).toBe("dev-published-test-profile");
    expect(await personService.getPublishedPersonBySlug("dev-draft-profile")).toBeNull();
    expect(await databaseRepository.getPublishedPersonBySlug("dev-draft-profile")).toBeNull();
    expect(await databaseRepository.getPublishedPersonBySlug("dev-review-profile")).toBeNull();
    expect(await databaseRepository.getPublishedPersonBySlug("dev-archived-profile")).toBeNull();
    expect(await databaseRepository.getPublishedPersonBySlug("does-not-exist")).toBeNull();
  });

  it("supports Arabic exact, partial, slug, category, and occupation search", async () => {
    expect((await databaseRepository.searchPublishedPeople({ query: "سجل اختبار تطويري — منشور" })).map((person) => person.slug)).toEqual(["dev-published-test-profile"]);
    expect((await databaseRepository.searchPublishedPeople({ query: "تطويري" })).map((person) => person.slug)).toEqual(["dev-published-test-profile"]);
    expect((await databaseRepository.searchPublishedPeople({ query: "dev-published-test-profile" })).map((person) => person.slug)).toEqual(["dev-published-test-profile"]);
    expect((await databaseRepository.searchPublishedPeople({ categoryId: "science" })).map((person) => person.slug)).toEqual(["dev-published-test-profile"]);
    expect((await databaseRepository.searchPublishedPeople({ occupation: "اختبار دورة النشر" })).map((person) => person.slug)).toEqual(["dev-published-test-profile"]);
    expect(await databaseRepository.searchPublishedPeople({ query: "مسودة" })).toEqual([]);
    expect(await databaseRepository.searchPublishedPeople({ query: "لا توجد نتيجة" })).toEqual([]);
  });
});
