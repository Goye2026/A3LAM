import { databaseRepository } from "@/lib/data/databaseRepository";
import type { PersonSearchQuery } from "@/lib/data/repository";

export const personService = {
  async listCategories() {
    return databaseRepository.listCategories();
  },

  async listPublishedPeople() {
    return databaseRepository.listPublishedPeople();
  },

  async listDisplayPeople() {
    return databaseRepository.listDisplayPeople();
  },

  async searchPublishedPeople(query: PersonSearchQuery) {
    return databaseRepository.searchPublishedPeople(query);
  },

  async getPublishedPersonBySlug(slug: string) {
    return databaseRepository.getPublishedPersonBySlug(slug);
  },

  async createPersonRecord(record: Parameters<typeof databaseRepository.createPersonRecord>[0]) {
    return databaseRepository.createPersonRecord(record);
  },

  async updatePerson(id: string, patch: Parameters<typeof databaseRepository.updatePerson>[1]) {
    return databaseRepository.updatePerson(id, patch);
  },
};
