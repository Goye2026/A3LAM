export const CONTENT_STATUSES = ["draft", "review", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SOURCE_TYPES = [
  "official",
  "institution",
  "government",
  "media",
  "professional",
  "academic",
  "secondary",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export type ValidationIssue = {
  path: string;
  message: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ContentStatus;
};

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  type: SourceType;
  reliability: "high" | "medium" | "low";
  status: ContentStatus;
};

export type TimelineEvent = {
  id: string;
  personId: string;
  date: string;
  title: string;
  description: string;
  sourceIds: string[];
};

export type Education = {
  id: string;
  personId: string;
  institution: string;
  field: string;
  dateRange: string;
  description: string;
  sourceIds: string[];
};

export type Person = {
  id: string;
  slug: string;
  name: string;
  nameArabic: string;
  shortBio: string;
  biography: string;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  categoryIds: string[];
  occupations: string[];
  image: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  timelineEventIds: string[];
  educationIds: string[];
  sourceIds: string[];
};

export type PersonRecord = {
  person: Person;
  categories: Category[];
  timeline: TimelineEvent[];
  education: Education[];
  sources: Source[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function isValidDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

function validateSourceIds(sourceIds: string[], knownSourceIds?: Set<string>) {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(sourceIds)) return [issue("sourceIds", "sourceIds must be an array")];
  if (knownSourceIds) {
    sourceIds.forEach((sourceId, index) => {
      if (!knownSourceIds.has(sourceId)) {
        issues.push(issue(`sourceIds.${index}`, `Unknown source id: ${sourceId}`));
      }
    });
  }
  return issues;
}

export function validateCategory(category: Category): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(category.id)) issues.push(issue("id", "Category id is required"));
  if (!SLUG_PATTERN.test(category.slug)) issues.push(issue("slug", "Category slug is invalid"));
  if (!isNonEmpty(category.name)) issues.push(issue("name", "Category name is required"));
  if (!isNonEmpty(category.description)) issues.push(issue("description", "Category description is required"));
  if (!CONTENT_STATUSES.includes(category.status)) issues.push(issue("status", "Category status is invalid"));
  return issues;
}

export function validateSource(source: Source): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(source.id)) issues.push(issue("id", "Source id is required"));
  if (!isNonEmpty(source.title)) issues.push(issue("title", "Source title is required"));
  if (!isNonEmpty(source.publisher)) issues.push(issue("publisher", "Source publisher is required"));
  try {
    const url = new URL(source.url);
    if (!["http:", "https:"].includes(url.protocol)) issues.push(issue("url", "Source URL must use http or https"));
  } catch {
    issues.push(issue("url", "Source URL is invalid"));
  }
  if (!isValidDate(source.accessedAt)) issues.push(issue("accessedAt", "Access date must be a valid ISO date"));
  if (!SOURCE_TYPES.includes(source.type)) issues.push(issue("type", "Source type is invalid"));
  if (!["high", "medium", "low"].includes(source.reliability)) issues.push(issue("reliability", "Source reliability is invalid"));
  if (!CONTENT_STATUSES.includes(source.status)) issues.push(issue("status", "Source status is invalid"));
  return issues;
}

export function validatePerson(
  person: Person,
  options: { knownCategoryIds?: Set<string>; knownSourceIds?: Set<string> } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(person.id)) issues.push(issue("id", "Person id is required"));
  if (!SLUG_PATTERN.test(person.slug)) issues.push(issue("slug", "Person slug is invalid"));
  if (!isNonEmpty(person.name)) issues.push(issue("name", "Person name is required"));
  if (!isNonEmpty(person.nameArabic)) issues.push(issue("nameArabic", "Arabic name is required"));
  if (!isNonEmpty(person.shortBio)) issues.push(issue("shortBio", "Short biography is required"));
  if (!isNonEmpty(person.biography)) issues.push(issue("biography", "Biography is required"));
  if (!CONTENT_STATUSES.includes(person.status)) issues.push(issue("status", "Person status is invalid"));
  if (!isValidDate(person.createdAt)) issues.push(issue("createdAt", "createdAt must be a valid ISO date"));
  if (!isValidDate(person.updatedAt)) issues.push(issue("updatedAt", "updatedAt must be a valid ISO date"));
  if (person.birthDate && !isValidDate(person.birthDate)) issues.push(issue("birthDate", "birthDate must be a valid ISO date"));
  if (person.deathDate && !isValidDate(person.deathDate)) issues.push(issue("deathDate", "deathDate must be a valid ISO date"));
  if (person.birthDate && person.deathDate && person.birthDate > person.deathDate) issues.push(issue("deathDate", "deathDate cannot precede birthDate"));
  if (!Array.isArray(person.categoryIds) || person.categoryIds.length === 0) issues.push(issue("categoryIds", "At least one category is required"));
  if (options.knownCategoryIds) {
    person.categoryIds.forEach((categoryId, index) => {
      if (!options.knownCategoryIds?.has(categoryId)) issues.push(issue(`categoryIds.${index}`, `Unknown category id: ${categoryId}`));
    });
  }
  if (!Array.isArray(person.occupations) || person.occupations.some((occupation) => !isNonEmpty(occupation))) issues.push(issue("occupations", "Occupations must contain non-empty values"));
  if (!Array.isArray(person.timelineEventIds)) issues.push(issue("timelineEventIds", "timelineEventIds must be an array"));
  if (!Array.isArray(person.educationIds)) issues.push(issue("educationIds", "educationIds must be an array"));
  issues.push(...validateSourceIds(person.sourceIds, options.knownSourceIds));
  return issues;
}

export function validateTimelineEvent(event: TimelineEvent, knownSourceIds?: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(event.id)) issues.push(issue("id", "Timeline event id is required"));
  if (!isNonEmpty(event.personId)) issues.push(issue("personId", "Timeline event personId is required"));
  if (!isValidDate(event.date)) issues.push(issue("date", "Timeline event date must be a valid ISO date"));
  if (!isNonEmpty(event.title)) issues.push(issue("title", "Timeline event title is required"));
  if (!isNonEmpty(event.description)) issues.push(issue("description", "Timeline event description is required"));
  issues.push(...validateSourceIds(event.sourceIds, knownSourceIds));
  return issues;
}

export function validateEducation(education: Education, knownSourceIds?: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(education.id)) issues.push(issue("id", "Education id is required"));
  if (!isNonEmpty(education.personId)) issues.push(issue("personId", "Education personId is required"));
  if (!isNonEmpty(education.institution)) issues.push(issue("institution", "Institution is required"));
  if (!isNonEmpty(education.field)) issues.push(issue("field", "Field is required"));
  if (!isNonEmpty(education.dateRange)) issues.push(issue("dateRange", "Date range is required"));
  if (!isNonEmpty(education.description)) issues.push(issue("description", "Education description is required"));
  issues.push(...validateSourceIds(education.sourceIds, knownSourceIds));
  return issues;
}

export function validatePublishedRecord(record: PersonRecord): ValidationIssue[] {
  const categoryIds = new Set(record.categories.map((category) => category.id));
  const sourceIds = new Set(record.sources.map((source) => source.id));
  const timelineIds = new Set(record.timeline.map((event) => event.id));
  const educationIds = new Set(record.education.map((item) => item.id));
  const issues: ValidationIssue[] = [];

  record.categories.forEach((category) => issues.push(...validateCategory(category)));
  record.sources.forEach((source) => issues.push(...validateSource(source)));
  issues.push(...validatePerson(record.person, { knownCategoryIds: categoryIds, knownSourceIds: sourceIds }));
  record.timeline.forEach((event) => {
    issues.push(...validateTimelineEvent(event, sourceIds));
    if (event.personId !== record.person.id) issues.push(issue(`timeline.${event.id}.personId`, "Timeline event belongs to another person"));
  });
  record.education.forEach((education) => {
    issues.push(...validateEducation(education, sourceIds));
    if (education.personId !== record.person.id) issues.push(issue(`education.${education.id}.personId`, "Education record belongs to another person"));
  });
  record.person.timelineEventIds.forEach((eventId) => {
    if (!timelineIds.has(eventId)) issues.push(issue(`person.timelineEventIds.${eventId}`, "Person timeline reference is missing"));
  });
  record.person.educationIds.forEach((educationId) => {
    if (!educationIds.has(educationId)) issues.push(issue(`person.educationIds.${educationId}`, "Person education reference is missing"));
  });

  if (record.person.status !== "published") issues.push(issue("person.status", "Only published people can be public records"));
  if (record.categories.some((category) => category.status !== "published")) issues.push(issue("categories", "Published people require published categories"));
  if (record.sources.some((source) => source.status !== "published")) issues.push(issue("sources", "Published people require published sources"));
  if (record.person.sourceIds.length === 0) issues.push(issue("person.sourceIds", "Published people require source references"));
  return issues;
}

export function isPublishedPerson(person: Person) {
  return person.status === "published";
}
