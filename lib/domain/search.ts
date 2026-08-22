import type { Person } from "./a3lam";

export type SearchQuery = {
  query?: string;
  categoryId?: string;
  occupation?: string;
};

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;

export function normalizeArabic(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ar")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[\u200C\u200D]/g, "")
    .replace(/[^\p{L}\p{N}-]+/gu, " ")
    .replace(/\s+/g, " ");
}

function matchesFilter(value: string, filter?: string) {
  if (!filter) return true;
  return normalizeArabic(value).includes(normalizeArabic(filter));
}

export function searchPeople(people: Person[], query: SearchQuery = {}) {
  const normalizedQuery = normalizeArabic(query.query ?? "");
  if (!normalizedQuery && !query.categoryId && !query.occupation) return [];

  return people
    .map((person, index) => {
      const searchable = [person.name, person.nameArabic, person.slug, person.shortBio, ...person.occupations]
        .map(normalizeArabic)
        .join(" ");
      const normalizedName = normalizeArabic(person.name);
      const normalizedArabicName = normalizeArabic(person.nameArabic);
      const normalizedSlug = normalizeArabic(person.slug);
      let score = 0;

      if (normalizedQuery) {
        if (normalizedName === normalizedQuery || normalizedArabicName === normalizedQuery || normalizedSlug === normalizedQuery) score += 100;
        else if (normalizedName.includes(normalizedQuery) || normalizedArabicName.includes(normalizedQuery)) score += 70;
        else if (normalizedSlug.includes(normalizedQuery)) score += 60;
        else if (searchable.includes(normalizedQuery)) score += 30;
      }

      const categoryMatch = !query.categoryId || person.categoryIds.includes(query.categoryId);
      const occupationMatch = matchesFilter(person.occupations.join(" "), query.occupation);
      if (!categoryMatch || !occupationMatch) return null;
      if (normalizedQuery && score === 0) return null;
      return { person, score, index };
    })
    .filter((result): result is { person: Person; score: number; index: number } => result !== null)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((result) => result.person);
}
