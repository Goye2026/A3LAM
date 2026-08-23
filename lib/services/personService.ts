import { databaseRepository } from "@/lib/data/databaseRepository";
import type { PersonSearchQuery } from "@/lib/data/repository";

export const personService = {
  async listCategories() {
    return databaseRepository.listCategories();
  },

  async getCategoryBySlug(slug: string) {
    const categories = await databaseRepository.listCategories();
    return categories.find((category) => category.slug === slug) ?? null;
  },

  async listPublishedPeopleByCategoryId(categoryId: string) {
    return databaseRepository.searchPublishedPeople({ categoryId });
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

  async hasPublishedPersonSlug(slug: string) {
    return databaseRepository.hasPublishedPersonSlug(slug);
  },

  async hasPublishedCategorySlug(slug: string) {
    return databaseRepository.hasPublishedCategorySlug(slug);
  },

  async createPersonRecord(record: Parameters<typeof databaseRepository.createPersonRecord>[0]) {
    return databaseRepository.createPersonRecord(record);
  },

  async updatePerson(id: string, patch: Parameters<typeof databaseRepository.updatePerson>[1]) {
    return databaseRepository.updatePerson(id, patch);
  },
};
