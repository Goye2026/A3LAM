import {
  type Category,
  type Person,
  type PersonRecord,
  validateCategory,
  validatePerson,
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
  listCategories() {
    return categories.filter((category) => category.status === "published");
  },

  listPublishedPeople() {
    return displayPeople.filter(isPublished);
  },

  getPersonBySlug(slug: string) {
    return records.find((item) => item.person.slug === slug) ?? null;
  },

  getPublishedPersonBySlug(slug: string) {
    const record = this.getPersonBySlug(slug);
    if (!record || !isPublished(record.person)) return null;
    return record;
  },

  searchPublishedPeople(query: PersonSearchQuery) {
    return searchPeople(this.listPublishedPeople(), query);
  },

  listDisplayPeople() {
    return displayPeople;
  },
};
