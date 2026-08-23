import { randomUUID } from "node:crypto";
import type { Category, ContentStatus, PersonRecord, Source, SourceType } from "@/lib/domain/a3lam";
import type { AdminCategoryInput, AdminEducationInput, AdminPersonInput, AdminSourceInput, AdminTimelineInput } from "@/lib/admin/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_TYPES: SourceType[] = ["official", "institution", "government", "media", "professional", "academic", "secondary"];
const RELIABILITIES = ["high", "medium", "low"] as const;

export class AdminInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminInputError";
  }
}

function text(value: unknown, field: string, options: { required?: boolean; max?: number } = {}) {
  if (typeof value !== "string") {
    if (!options.required && (value === null || value === undefined)) return "";
    throw new AdminInputError(`${field} must be text`);
  }
  const normalized = value.trim();
  if (options.required && !normalized) throw new AdminInputError(`${field} is required`);
  if (options.max && normalized.length > options.max) throw new AdminInputError(`${field} is too long`);
  return normalized;
}

function optionalDate(value: unknown, field: string) {
  const normalized = text(value, field, { max: 10 });
  if (!normalized) return null;
  if (!ISO_DATE_PATTERN.test(normalized) || Number.isNaN(new Date(`${normalized}T00:00:00.000Z`).getTime())) {
    throw new AdminInputError(`${field} must be an ISO date`);
  }
  return normalized;
}

function requiredDate(value: unknown, field: string) {
  const normalized = optionalDate(value, field);
  if (!normalized) throw new AdminInputError(`${field} is required`);
  return normalized;
}

function stringArray(value: unknown, field: string, maxItems: number) {
  if (!Array.isArray(value)) throw new AdminInputError(`${field} must be an array`);
  if (value.length > maxItems) throw new AdminInputError(`${field} has too many items`);
  const values = value.map((item, index) => text(item, `${field}.${index}`, { required: true, max: 300 }));
  return [...new Set(values)];
}

function safeUrl(value: unknown, field: string) {
  const normalized = text(value, field, { required: true, max: 2000 });
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new AdminInputError(`${field} must be a valid URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new AdminInputError(`${field} must use http or https`);
  return url.toString();
}

export function parseAdminCategoryInput(value: unknown, status: ContentStatus = "published"): AdminCategoryInput {
  if (!value || typeof value !== "object") throw new AdminInputError("The submitted category payload is invalid");
  const item = value as Record<string, unknown>;
  const slug = text(item.slug, "slug", { required: true, max: 120 });
  if (!SLUG_PATTERN.test(slug)) throw new AdminInputError("slug must contain lowercase latin characters and hyphens only");
  if (!["draft", "review", "published", "archived"].includes(status)) throw new AdminInputError("status is invalid");
  return {
    name: text(item.name, "name", { required: true, max: 300 }),
    description: text(item.description, "description", { required: true, max: 5000 }),
    slug,
    status,
  };
}

export function parseAdminStatus(value: unknown): ContentStatus {
  const normalized = text(value, "status", { required: true });
  if (!["draft", "review", "published", "archived"].includes(normalized)) throw new AdminInputError("status is invalid");
  return normalized as ContentStatus;
}

function sourceType(value: unknown): SourceType {
  const normalized = text(value, "source.type", { required: true });
  if (!SOURCE_TYPES.includes(normalized as SourceType)) throw new AdminInputError("source.type is invalid");
  return normalized as SourceType;
}

function reliability(value: unknown) {
  const normalized = text(value, "source.reliability", { required: true });
  if (!RELIABILITIES.includes(normalized as (typeof RELIABILITIES)[number])) throw new AdminInputError("source.reliability is invalid");
  return normalized as (typeof RELIABILITIES)[number];
}

function sourceInput(value: unknown, index: number): AdminSourceInput {
  if (!value || typeof value !== "object") throw new AdminInputError(`sources.${index} is invalid`);
  const item = value as Record<string, unknown>;
  const id = item.id === undefined || item.id === "" ? undefined : text(item.id, `sources.${index}.id`, { max: 120 });
  return {
    id,
    title: text(item.title, `sources.${index}.title`, { required: true, max: 500 }),
    publisher: text(item.publisher, `sources.${index}.publisher`, { required: true, max: 300 }),
    url: safeUrl(item.url, `sources.${index}.url`),
    publicationDate: optionalDate(item.publicationDate, `sources.${index}.publicationDate`) ?? "",
    accessedAt: requiredDate(item.accessedAt, `sources.${index}.accessedAt`),
    type: sourceType(item.type),
    reliability: reliability(item.reliability),
  };
}

function timelineInput(value: unknown, index: number): AdminTimelineInput {
  if (!value || typeof value !== "object") throw new AdminInputError(`timeline.${index} is invalid`);
  const item = value as Record<string, unknown>;
  return {
    id: item.id === undefined || item.id === "" ? undefined : text(item.id, `timeline.${index}.id`, { max: 120 }),
    date: requiredDate(item.date, `timeline.${index}.date`),
    title: text(item.title, `timeline.${index}.title`, { required: true, max: 500 }),
    description: text(item.description, `timeline.${index}.description`, { required: true, max: 5000 }),
    sourceIds: stringArray(item.sourceIds ?? [], `timeline.${index}.sourceIds`, 50),
  };
}

function educationInput(value: unknown, index: number): AdminEducationInput {
  if (!value || typeof value !== "object") throw new AdminInputError(`education.${index} is invalid`);
  const item = value as Record<string, unknown>;
  return {
    id: item.id === undefined || item.id === "" ? undefined : text(item.id, `education.${index}.id`, { max: 120 }),
    institution: text(item.institution, `education.${index}.institution`, { required: true, max: 500 }),
    field: text(item.field, `education.${index}.field`, { required: true, max: 500 }),
    dateRange: text(item.dateRange, `education.${index}.dateRange`, { required: true, max: 200 }),
    description: text(item.description, `education.${index}.description`, { required: true, max: 5000 }),
    sourceIds: stringArray(item.sourceIds ?? [], `education.${index}.sourceIds`, 50),
  };
}

export function parseAdminPersonInput(value: unknown): AdminPersonInput {
  if (!value || typeof value !== "object") throw new AdminInputError("The submitted person payload is invalid");
  const item = value as Record<string, unknown>;
  const status = parseAdminStatus(item.status ?? "draft");
  const isDraft = status === "draft";
  const slug = text(item.slug, "slug", { required: true, max: 120 });
  if (!SLUG_PATTERN.test(slug)) throw new AdminInputError("slug must contain lowercase latin characters and hyphens only");
  const sources = Array.isArray(item.sources) ? item.sources.map(sourceInput) : (() => { throw new AdminInputError("sources must be an array"); })();
  const timeline = Array.isArray(item.timeline) ? item.timeline.map(timelineInput) : (() => { throw new AdminInputError("timeline must be an array"); })();
  const education = Array.isArray(item.education) ? item.education.map(educationInput) : (() => { throw new AdminInputError("education must be an array"); })();
  const sourceIds = new Set(sources.map((source) => source.id).filter((id): id is string => Boolean(id)));
  const childSourceIds = [...timeline.flatMap((event) => event.sourceIds), ...education.flatMap((entry) => entry.sourceIds)];
  if (childSourceIds.some((id) => !sourceIds.has(id))) throw new AdminInputError("Every timeline and education source must be listed in sources");

  return {
    name: text(item.name, "name", { required: true, max: 300 }),
    nameArabic: text(item.nameArabic, "nameArabic", { required: true, max: 300 }),
    slug,
    shortBio: text(item.shortBio, "shortBio", { required: !isDraft, max: 2000 }),
    biography: text(item.biography, "biography", { required: !isDraft, max: 100000 }),
    birthDate: optionalDate(item.birthDate, "birthDate") ?? "",
    deathDate: optionalDate(item.deathDate, "deathDate") ?? "",
    birthPlace: text(item.birthPlace, "birthPlace", { max: 300 }),
    deathPlace: text(item.deathPlace, "deathPlace", { max: 300 }),
    image: text(item.image, "image", { max: 2000 }),
    status,
    categoryIds: stringArray(item.categoryIds ?? [], "categoryIds", 30),
    occupations: stringArray(item.occupations ?? [], "occupations", 30),
    sources,
    timeline,
    education,
  };
}

export function buildPersonRecord(input: AdminPersonInput, categories: Category[], existing?: PersonRecord): PersonRecord {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const selectedCategories = input.categoryIds.map((id) => categoryMap.get(id));
  if (selectedCategories.some((category) => !category)) throw new AdminInputError("One or more categories do not exist");

  const now = new Date().toISOString();
  const sourceIds = new Map<string, string>();
  const sources = input.sources.map((source) => {
    const id = source.id || randomUUID();
    if (sourceIds.has(id)) throw new AdminInputError("Source IDs must be unique");
    sourceIds.set(id, id);
    return {
      id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      publicationDate: source.publicationDate || null,
      accessedAt: source.accessedAt,
      type: source.type,
      reliability: source.reliability,
      status: input.status === "published" ? "published" : input.status as Source["status"],
    };
  });

  const personId = existing?.person.id ?? randomUUID();
  const timeline = input.timeline.map((event) => ({
    id: event.id || randomUUID(),
    personId,
    date: event.date,
    title: event.title,
    description: event.description,
    sourceIds: event.sourceIds,
  }));
  const education = input.education.map((item) => ({
    id: item.id || randomUUID(),
    personId,
    institution: item.institution,
    field: item.field,
    dateRange: item.dateRange,
    description: item.description,
    sourceIds: item.sourceIds,
  }));

  return {
    person: {
      id: personId,
      slug: input.slug,
      name: input.name,
      nameArabic: input.nameArabic,
      shortBio: input.shortBio,
      biography: input.biography,
      birthDate: input.birthDate || null,
      deathDate: input.deathDate || null,
      birthPlace: input.birthPlace || null,
      deathPlace: input.deathPlace || null,
      categoryIds: input.categoryIds,
      occupations: input.occupations,
      image: input.image || null,
      status: input.status,
      createdAt: existing?.person.createdAt ?? now,
      updatedAt: now,
      timelineEventIds: timeline.map((event) => event.id),
      educationIds: education.map((item) => item.id),
      sourceIds: sources.map((source) => source.id),
    },
    categories: selectedCategories as Category[],
    sources,
    timeline,
    education,
  };
}
