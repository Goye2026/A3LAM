import {
  type Category,
  type Person,
  type PersonRecord,
  validateCategory,
  validatePerson,
  validateSource,
} from "@/lib/domain/a3lam";
import { searchPeople } from "@/lib/domain/search";
import type { PersonRepository, PersonSearchQuery } from "./repository";

const categories: Category[] = [
  { id: "media", slug: "media-journalism", name: "الإعلام والصحافة", description: "ملفات الإعلام والصحافة والاتصال العام.", status: "published" },
  { id: "academia", slug: "academia-research", name: "الأكاديميا والبحث", description: "ملفات التعليم العالي والبحث والمعرفة المتخصصة.", status: "published" },
  { id: "culture", slug: "culture-arts", name: "الثقافة والفنون", description: "ملفات الأدب والفنون والإنتاج الثقافي.", status: "published" },
  { id: "business", slug: "business-economy", name: "الأعمال والاقتصاد", description: "ملفات الأعمال والاقتصاد وريادة المشاريع.", status: "published" },
  { id: "society", slug: "society-impact", name: "المجتمع والتأثير", description: "ملفات المبادرات المجتمعية والتأثير العام.", status: "published" },
  { id: "science", slug: "science-technology", name: "العلوم والتقنية", description: "ملفات العلوم والهندسة والتقنية والابتكار.", status: "published" },
  { id: "sports", slug: "sports", name: "الرياضة", description: "ملفات الرياضة والتدريب والإدارة الرياضية.", status: "published" },
];

const displayPeople: Person[] = [
  {
    id: "sample-profile-one",
    slug: "sample-profile-one",
    name: "نموذج شخصية أولى",
    nameArabic: "نموذج شخصية أولى",
    shortBio: "سجل عرض تجريبي يوضح بنية الشخصية في المنصة.",
    biography: "هذا سجل عرض غير منشور، ولا يمثل سيرة شخص حقيقي.",
    birthDate: null,
    deathDate: null,
    birthPlace: null,
    deathPlace: null,
    categoryIds: ["media"],
    occupations: ["الإعلام والصحافة"],
    image: null,
    status: "draft",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    timelineEventIds: [],
    educationIds: [],
    sourceIds: [],
  },
  {
    id: "sample-profile-two",
    slug: "sample-profile-two",
    name: "نموذج شخصية ثانية",
    nameArabic: "نموذج شخصية ثانية",
    shortBio: "سجل عرض تجريبي يوضح تصنيفًا أكاديميًا.",
    biography: "هذا سجل عرض غير منشور، ولا يمثل سيرة شخص حقيقي.",
    birthDate: null,
    deathDate: null,
    birthPlace: null,
    deathPlace: null,
    categoryIds: ["academia"],
    occupations: ["الأكاديميا والبحث"],
    image: null,
    status: "review",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    timelineEventIds: [],
    educationIds: [],
    sourceIds: [],
  },
  {
    id: "sample-profile-three",
    slug: "sample-profile-three",
    name: "نموذج شخصية ثالثة",
    nameArabic: "نموذج شخصية ثالثة",
    shortBio: "سجل عرض تجريبي يوضح تصنيفًا ثقافيًا.",
    biography: "هذا سجل عرض غير منشور، ولا يمثل سيرة شخص حقيقي.",
    birthDate: null,
    deathDate: null,
    birthPlace: null,
    deathPlace: null,
    categoryIds: ["culture"],
    occupations: ["الثقافة والفنون"],
    image: null,
    status: "archived",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    timelineEventIds: [],
    educationIds: [],
    sourceIds: [],
  },
];

const records: PersonRecord[] = displayPeople.map((person) => ({
  person,
  categories: categories.filter((category) => person.categoryIds.includes(category.id)),
  timeline: [],
  education: [],
  sources: [],
}));

function assertLocalDataset() {
  const categoryIds = new Set(categories.map((category) => category.id));
  const categoryIssues = categories.flatMap(validateCategory);
  const personIssues = displayPeople.flatMap((person) => validatePerson(person, { knownCategoryIds: categoryIds }));
  const issues = [...categoryIssues, ...personIssues];
  if (issues.length > 0) {
    throw new Error(`Invalid local A3LAM dataset: ${issues.map((item) => `${item.path}: ${item.message}`).join("; ")}`);
  }
}

assertLocalDataset();

function isPublished(person: Person) {
  return person.status === "published";
}

export const localRepository: PersonRepository = {
  async listCategories() {
    return categories.filter((category) => category.status === "published");
  },

  async listPublishedPeople() {
    return displayPeople.filter(isPublished);
  },

  async getPersonBySlug(slug: string) {
    return records.find((item) => item.person.slug === slug) ?? null;
  },

  async getPublishedPersonBySlug(slug: string) {
    const record = await this.getPersonBySlug(slug);
    if (!record || !isPublished(record.person)) return null;
    return record;
  },

  async searchPublishedPeople(query: PersonSearchQuery) {
    return searchPeople(await this.listPublishedPeople(), query);
  },

  async listDisplayPeople() {
    return displayPeople;
  },

  async createPersonRecord(record: PersonRecord) {
    const categoryIds = new Set(categories.map((category) => category.id));
    const issues = [
      ...record.categories.flatMap(validateCategory),
      ...record.sources.flatMap(validateSource),
      ...validatePerson(record.person, { knownCategoryIds: categoryIds, knownSourceIds: new Set(record.sources.map((source) => source.id)) }),
    ];
    if (issues.length > 0) throw new Error(`Invalid local record: ${issues.map((item) => `${item.path}: ${item.message}`).join("; ")}`);
    records.push(record);
    displayPeople.push(record.person);
    return record;
  },

  async updatePerson(id: string, patch: Partial<Person>) {
    const index = records.findIndex((record) => record.person.id === id);
    if (index === -1) return null;
    const updatedPerson = { ...records[index].person, ...patch, updatedAt: new Date().toISOString() };
    const updatedRecord = { ...records[index], person: updatedPerson };
    records[index] = updatedRecord;
    const displayIndex = displayPeople.findIndex((person) => person.id === id);
    if (displayIndex !== -1) displayPeople[displayIndex] = updatedPerson;
    return updatedRecord;
  },
};
