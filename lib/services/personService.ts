import { localRepository } from "@/lib/data/localRepository";
import type { PersonSearchQuery } from "@/lib/data/repository";

export const personService = {
  listCategories() {
    return localRepository.listCategories();
  },

  listPublishedPeople() {
    return localRepository.listPublishedPeople();
  },

  listDisplayPeople() {
    return localRepository.listDisplayPeople();
  },

  searchPublishedPeople(query: PersonSearchQuery) {
    return localRepository.searchPublishedPeople(query);
  },

  getPublishedPersonBySlug(slug: string) {
    return localRepository.getPublishedPersonBySlug(slug);
  },
};
