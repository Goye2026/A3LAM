import type { Category, Person, PersonRecord } from "@/lib/domain/a3lam";
import type { SearchQuery } from "@/lib/domain/search";

export type PersonSearchQuery = SearchQuery;

export type PersonRepository = {
  listCategories(): Promise<Category[]>;
  listPublishedPeople(): Promise<Person[]>;
  getPersonBySlug(slug: string): Promise<PersonRecord | null>;
  getPublishedPersonBySlug(slug: string): Promise<PersonRecord | null>;
  searchPublishedPeople(query: PersonSearchQuery): Promise<Person[]>;
  listDisplayPeople(): Promise<Person[]>;
  createPersonRecord(record: PersonRecord): Promise<PersonRecord>;
  updatePerson(id: string, patch: Partial<Person>): Promise<PersonRecord | null>;
};
