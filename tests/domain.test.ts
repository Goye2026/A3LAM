import { describe, expect, it } from "vitest";
import { localRepository } from "@/lib/data/localRepository";
import {
  type Category,
  type Person,
  type PersonRecord,
  type Source,
  validateCategory,
  validatePerson,
  validatePublishedRecord,
  validateSource,
} from "@/lib/domain/a3lam";
import { searchPeople } from "@/lib/domain/search";

const category: Category = {
  id: "media",
  slug: "media-journalism",
  name: "الإعلام والصحافة",
  description: "تصنيف اختباري صالح.",
  status: "published",
};

const source: Source = {
  id: "source-1",
  title: "صفحة المؤسسة الرسمية",
  publisher: "مؤسسة اختبارية",
  url: "https://example.com/profile",
  accessedAt: "2026-08-22",
  type: "official",
  reliability: "high",
  status: "published",
};

const publishedPerson: Person = {
  id: "person-1",
  slug: "ahmed-ali",
  name: "أحمد علي",
  nameArabic: "أحمد علي",
  shortBio: "نبذة موثقة للاختبار.",
  biography: "سيرة اختبارية لا تمثل شخصية منشورة في المنتج.",
  birthDate: null,
  deathDate: null,
  birthPlace: null,
  deathPlace: null,
  categoryIds: ["media"],
  occupations: ["صحفي"],
  image: null,
  status: "published",
  createdAt: "2026-01-01",
  updatedAt: "2026-08-22",
  timelineEventIds: [],
  educationIds: [],
  sourceIds: ["source-1"],
};

const publishedRecord: PersonRecord = {
  person: publishedPerson,
  categories: [category],
  timeline: [],
  education: [],
  sources: [source],
};

describe("Phase 04 domain validation", () => {
  it("requires person names, valid slug, status, dates, and relationships", () => {
    const issues = validatePerson(
      { ...publishedPerson, name: "", slug: "Bad Slug", birthDate: "2026-02-30", categoryIds: ["missing"] },
      { knownCategoryIds: new Set(["media"]), knownSourceIds: new Set(["source-1"]) },
    );
    expect(issues.map((item) => item.path)).toEqual(expect.arrayContaining(["name", "slug", "birthDate", "categoryIds.0"]));
  });

  it("validates category and source records", () => {
    expect(validateCategory(category)).toEqual([]);
    expect(validateCategory({ ...category, slug: "bad slug" })).toEqual(
      expect.arrayContaining([{ path: "slug", message: "Category slug is invalid" }]),
    );
    expect(validateSource(source)).toEqual([]);
    expect(validateSource({ ...source, url: "not-a-url" })).toEqual(
      expect.arrayContaining([{ path: "url", message: "Source URL is invalid" }]),
    );
  });

  it("requires source references before a record can be published", () => {
    expect(validatePublishedRecord(publishedRecord)).toEqual([]);
    const issues = validatePublishedRecord({
      ...publishedRecord,
      person: { ...publishedPerson, sourceIds: [] },
      sources: [],
    });
    expect(issues.map((item) => item.path)).toEqual(expect.arrayContaining(["person.sourceIds"]));
  });
});

describe("Phase 04 repository lifecycle", () => {
  it("distinguishes lifecycle states internally and excludes them from public lookup", () => {
    expect(localRepository.getPersonBySlug("sample-profile-one")?.person.status).toBe("draft");
    expect(localRepository.getPersonBySlug("sample-profile-two")?.person.status).toBe("review");
    expect(localRepository.getPersonBySlug("sample-profile-three")?.person.status).toBe("archived");
    expect(localRepository.getPersonBySlug("does-not-exist")).toBeNull();
    expect(localRepository.listPublishedPeople()).toEqual([]);
    expect(localRepository.getPublishedPersonBySlug("sample-profile-one")).toBeNull();
    expect(localRepository.getPublishedPersonBySlug("sample-profile-two")).toBeNull();
    expect(localRepository.getPublishedPersonBySlug("sample-profile-three")).toBeNull();
    expect(localRepository.getPublishedPersonBySlug("does-not-exist")).toBeNull();
  });
});

describe("Phase 04 Arabic search", () => {
  it("supports exact name, partial name, slug, and category filters", () => {
    expect(searchPeople([publishedPerson], { query: "أحمد علي" })).toEqual([publishedPerson]);
    expect(searchPeople([publishedPerson], { query: "احمد" })).toEqual([publishedPerson]);
    expect(searchPeople([publishedPerson], { query: "ahmed-ali" })).toEqual([publishedPerson]);
    expect(searchPeople([publishedPerson], { categoryId: "media" })).toEqual([publishedPerson]);
    expect(searchPeople([publishedPerson], { occupation: "صحفي" })).toEqual([publishedPerson]);
    expect(searchPeople([publishedPerson], { categoryId: "science" })).toEqual([]);
  });

  it("returns an empty result for empty queries and no matches", () => {
    expect(searchPeople([publishedPerson], {})).toEqual([]);
    expect(searchPeople([publishedPerson], { query: "لا يوجد" })).toEqual([]);
  });
});
