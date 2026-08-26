import { describe, expect, it } from "vitest";
import type { PersonRecord } from "@/lib/domain/a3lam";
import { evaluatePersonListReadiness, evaluatePersonReadiness, summarizePersonReadiness } from "@/lib/admin/launch";

function makeRecord(overrides: Partial<PersonRecord["person"]> = {}, related: Partial<Pick<PersonRecord, "categories" | "sources" | "timeline" | "education">> = {}): PersonRecord {
  const personId = "person-1";
  const category = { id: "category-1", slug: "history", name: "التاريخ", description: "تصنيف منشور", status: "published" as const };
  const source = { id: "source-1", title: "Official source", publisher: "Institution", url: "https://example.org/source", publicationDate: null, accessedAt: "2026-08-26", type: "official" as const, reliability: "high" as const, status: "published" as const };
  return {
    person: {
      id: personId,
      slug: "person-one",
      name: "Person One",
      nameArabic: "الشخص الأول",
      shortBio: "A concise biography.",
      biography: "A full biography with enough editorial content.",
      birthDate: "1980-01-01",
      deathDate: null,
      birthPlace: "Sana'a",
      deathPlace: null,
      categoryIds: [category.id],
      occupations: ["Researcher"],
      image: "https://example.org/portrait.webp",
      status: "review",
      createdAt: "2026-08-26T00:00:00.000Z",
      updatedAt: "2026-08-26T00:00:00.000Z",
      timelineEventIds: ["event-1"],
      educationIds: [],
      sourceIds: [source.id],
      ...overrides,
    },
    categories: related.categories ?? [category],
    sources: related.sources ?? [source],
    timeline: related.timeline ?? [{ id: "event-1", personId, date: "2000-01-01", title: "Milestone", description: "A sourced milestone.", sourceIds: [source.id] }],
    education: related.education ?? [],
  };
}

describe("phase 17.17 editorial readiness", () => {
  it("marks a complete review record ready for publication", () => {
    const result = evaluatePersonReadiness(makeRecord());
    expect(result.state).toBe("READY_FOR_PUBLICATION");
    expect(result.required).toEqual({ completed: 7, total: 7, missing: [] });
    expect(result.recommended).toEqual({ completed: 5, total: 5, missing: [] });
    expect(result.media).toBe("PRESENT");
  });

  it("keeps an optional missing portrait advisory instead of blocking", () => {
    const result = evaluatePersonReadiness(makeRecord({ image: null }));
    expect(result.state).toBe("READY_FOR_PUBLICATION");
    expect(result.media).toBe("MISSING_RECOMMENDED");
    expect(result.recommended.missing).toContain("portrait");
  });

  it("marks missing required editorial data incomplete", () => {
    const result = evaluatePersonReadiness(makeRecord({ nameArabic: "", categoryIds: [], occupations: [] }));
    expect(result.state).toBe("INCOMPLETE");
    expect(result.required.missing).toEqual(expect.arrayContaining(["nameArabic", "category", "occupations"]));
    expect(result.issues).toEqual([]);
  });

  it("blocks an invalid public media reference", () => {
    const result = evaluatePersonReadiness(makeRecord({ image: "javascript:alert(1)" }));
    expect(result.state).toBe("BLOCKED");
    expect(result.media).toBe("INVALID");
    expect(result.issues[0]?.path).toBe("person.image");
  });

  it("blocks a published record with unpublished category relationships", () => {
    const record = makeRecord({ status: "published" }, { categories: [{ id: "category-1", slug: "history", name: "التاريخ", description: "Draft category", status: "draft" }] });
    const result = evaluatePersonReadiness(record);
    expect(result.state).toBe("BLOCKED");
    expect(result.issues.some((issue) => issue.path === "categories")).toBe(true);
  });

  it("evaluates bounded People list input without loading relations", () => {
    const result = evaluatePersonListReadiness({ status: "published", name: "Person One", nameArabic: "الشخص الأول", slug: "person-one", shortBio: "Short", biography: "Full", categoryCount: 1, publishedCategoryCount: 1, occupationCount: 1, sourceCount: 1, publishedSourceCount: 1, imageUrl: null });
    expect(result.state).toBe("READY_FOR_PUBLICATION");
    expect(result.requiredCompleted).toBe(7);
    expect(result.recommendedCompleted).toBe(1);
  });

  it("blocks a published list item with an unpublished relationship", () => {
    const result = evaluatePersonListReadiness({ status: "published", name: "Person One", nameArabic: "الشخص الأول", slug: "person-one", shortBio: "Short", biography: "Full", categoryCount: 1, publishedCategoryCount: 0, occupationCount: 1, sourceCount: 1, publishedSourceCount: 1, imageUrl: null });
    expect(result.state).toBe("BLOCKED");
  });

  it("summarizes states without claiming historical accuracy", () => {
    const complete = evaluatePersonReadiness(makeRecord());
    const incomplete = evaluatePersonReadiness(makeRecord({ biography: "", image: null }));
    const summary = summarizePersonReadiness([complete, incomplete]);
    expect(summary).toMatchObject({ total: 2, READY_FOR_PUBLICATION: 1, INCOMPLETE: 1, withSources: 2, withPortrait: 1 });
  });
});
