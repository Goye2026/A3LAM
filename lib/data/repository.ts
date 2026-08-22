import type { Category, Person, PersonRecord } from "@/lib/domain/a3lam";
import type { SearchQuery } from "@/lib/domain/search";

export type PersonSearchQuery = SearchQuery;

export type PersonRepository = {
  listCategories(): Category[];
  listPublishedPeople(): Person[];
  getPersonBySlug(slug: string): PersonRecord | null;
  getPublishedPersonBySlug(slug: string): PersonRecord | null;
  searchPublishedPeople(query: PersonSearchQuery): Person[];
  listDisplayPeople(): Person[];
};
