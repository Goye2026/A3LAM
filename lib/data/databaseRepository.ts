import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  type Category,
  type Education,
  type Person,
  type PersonRecord,
  type Source,
  type TimelineEvent,
  validateCategory,
  validateEducation,
  validatePerson,
  validatePublishedRecord,
  validateSource,
  validateTimelineEvent,
} from "@/lib/domain/a3lam";
import { normalizeArabic } from "@/lib/domain/search";
import { getSafePublicImageUrl } from "@/lib/media/public";
import type { PersonRepository, PersonSearchQuery } from "./repository";

type Database = PostgresJsDatabase<typeof schema>;

type PersonRow = typeof schema.people.$inferSelect;

type NewPersonRecord = PersonRecord;
const PUBLIC_SEARCH_LIMIT = 100;

function asIsoDate(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function asIsoTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function assertValidRecord(record: PersonRecord) {
  const categoryIds = new Set(record.categories.map((category) => category.id));
  const sourceIds = new Set(record.sources.map((source) => source.id));
  const issues = record.person.status === "published"
    ? validatePublishedRecord(record)
    : [
        ...record.categories.flatMap(validateCategory),
        ...record.sources.flatMap(validateSource),
        ...validatePerson(record.person, { knownCategoryIds: categoryIds, knownSourceIds: sourceIds }),
        ...record.timeline.flatMap((event) => validateTimelineEvent(event, sourceIds)),
        ...record.education.flatMap((item) => validateEducation(item, sourceIds)),
      ];
  if (issues.length > 0) {
    throw new Error(`Invalid A3LAM record: ${issues.map((item) => `${item.path}: ${item.message}`).join("; ")}`);
  }
}

async function getPublicPortraitUrl(db: Database, personId: string) {
  try {
    const rows = await db.select({ publicUrl: schema.mediaAssets.publicUrl }).from(schema.personMedia).innerJoin(schema.mediaAssets, eq(schema.personMedia.mediaAssetId, schema.mediaAssets.id)).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.usageType, "portrait"), eq(schema.personMedia.isPrimary, true), eq(schema.mediaAssets.status, "ready"), eq(schema.mediaAssets.visibility, "public"))).limit(1);
    return getSafePublicImageUrl(rows[0]?.publicUrl ?? null);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01") return null;
    throw error;
  }
}

async function hydratePerson(db: Database, row: PersonRow): Promise<PersonRecord> {
  const categoryRows = await db
    .select({ category: schema.categories })
    .from(schema.personCategories)
    .innerJoin(schema.categories, eq(schema.personCategories.categoryId, schema.categories.id))
    .where(eq(schema.personCategories.personId, row.id));
  const occupationRows = await db
    .select({ occupation: schema.personOccupations.occupation })
    .from(schema.personOccupations)
    .where(eq(schema.personOccupations.personId, row.id));
  const personSourceRows = await db
    .select({ source: schema.sources })
    .from(schema.personSources)
    .innerJoin(schema.sources, eq(schema.personSources.sourceId, schema.sources.id))
    .where(eq(schema.personSources.personId, row.id));
  const timelineRows = await db
    .select({ event: schema.timelineEvents })
    .from(schema.timelineEvents)
    .where(eq(schema.timelineEvents.personId, row.id))
    .orderBy(asc(schema.timelineEvents.eventDate));
  const educationRows = await db
    .select({ item: schema.education })
    .from(schema.education)
    .where(eq(schema.education.personId, row.id))
    .orderBy(asc(schema.education.id));

  const timeline: TimelineEvent[] = [];
  for (const { event } of timelineRows) {
    const sourceRows = await db
      .select({ sourceId: schema.timelineEventSources.sourceId })
      .from(schema.timelineEventSources)
      .where(eq(schema.timelineEventSources.eventId, event.id));
    timeline.push({
      id: event.id,
      personId: event.personId,
      date: asIsoDate(event.eventDate) ?? "",
      title: event.title,
      description: event.description,
      sourceIds: sourceRows.map((source) => source.sourceId),
    });
  }

  const education: Education[] = [];
  for (const { item } of educationRows) {
    const sourceRows = await db
      .select({ sourceId: schema.educationSources.sourceId })
      .from(schema.educationSources)
      .where(eq(schema.educationSources.educationId, item.id));
    education.push({
      id: item.id,
      personId: item.personId,
      institution: item.institution,
      field: item.field,
      dateRange: item.dateRange,
      description: item.description,
      sourceIds: sourceRows.map((source) => source.sourceId),
    });
  }

  const publicPortraitUrl = await getPublicPortraitUrl(db, row.id);
  const person: Person = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameArabic: row.nameArabic,
    shortBio: row.shortBio,
    biography: row.biography,
    birthDate: asIsoDate(row.birthDate),
    deathDate: asIsoDate(row.deathDate),
    birthPlace: row.birthPlace,
    deathPlace: row.deathPlace,
    categoryIds: categoryRows.map(({ category }) => category.id),
    occupations: occupationRows.map(({ occupation }) => occupation),
    image: publicPortraitUrl ?? getSafePublicImageUrl(row.imageUrl),
    status: row.status,
    createdAt: asIsoTimestamp(row.createdAt),
    updatedAt: asIsoTimestamp(row.updatedAt),
    timelineEventIds: timeline.map((event) => event.id),
    educationIds: education.map((item) => item.id),
    sourceIds: personSourceRows.map(({ source }) => source.id),
  };

  const sources: Source[] = personSourceRows.map(({ source }) => ({
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    publicationDate: asIsoDate(source.publicationDate),
    accessedAt: asIsoDate(source.accessedAt) ?? "",
    type: source.sourceType,
    reliability: source.reliability,
    status: source.status,
  }));
  const categories: Category[] = categoryRows.map(({ category }) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    status: category.status,
  }));

  return { person, categories, timeline, education, sources };
}

async function getPersonBySlug(db: Database, slug: string, publishedOnly = false) {
  const conditions = [eq(schema.people.slug, slug)];
  if (publishedOnly) conditions.push(eq(schema.people.status, "published"));
  const rows = await db.select().from(schema.people).where(and(...conditions)).limit(1);
  if (rows.length === 0) return null;
  const record = await hydratePerson(db, rows[0]);
  if (publishedOnly && validatePublishedRecord(record).length > 0) return null;
  return record;
}

async function getCategoryIds(db: Database, categoryId: string) {
  const rows = await db
    .select({ personId: schema.personCategories.personId })
    .from(schema.personCategories)
    .where(eq(schema.personCategories.categoryId, categoryId));
  return rows.map((row) => row.personId);
}

async function getOccupationIds(db: Database, occupation: string) {
  const normalized = normalizeArabic(occupation);
  const rows = await db
    .select({ personId: schema.personOccupations.personId })
    .from(schema.personOccupations)
    .where(ilike(schema.personOccupations.occupationNormalized, `%${normalized}%`));
  return rows.map((row) => row.personId);
}

async function searchPublishedPeople(db: Database, query: PersonSearchQuery) {
  const conditions = [eq(schema.people.status, "published")];
  const normalizedQuery = normalizeArabic(query.query ?? "");
  if (normalizedQuery) {
    const pattern = `%${normalizedQuery}%`;
    conditions.push(or(
      ilike(schema.people.searchName, pattern),
      ilike(schema.people.searchNameArabic, pattern),
      ilike(schema.people.slug, pattern),
    )!);
  }
  if (query.categoryId) {
    const ids = await getCategoryIds(db, query.categoryId);
    if (ids.length === 0) return [];
    conditions.push(inArray(schema.people.id, ids));
  }
  if (query.occupation) {
    const ids = await getOccupationIds(db, query.occupation);
    if (ids.length === 0) return [];
    conditions.push(inArray(schema.people.id, ids));
  }
  const rows = await db.select().from(schema.people).where(and(...conditions)).orderBy(asc(schema.people.name)).limit(PUBLIC_SEARCH_LIMIT);
  return Promise.all(rows.map((row) => hydratePerson(db, row)));
}

function personInsertValues(person: Person) {
  return {
    id: person.id,
    slug: person.slug,
    name: person.name,
    nameArabic: person.nameArabic,
    shortBio: person.shortBio,
    biography: person.biography,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthPlace: person.birthPlace,
    deathPlace: person.deathPlace,
    imageUrl: person.image,
    status: person.status,
    searchName: normalizeArabic(person.name),
    searchNameArabic: normalizeArabic(person.nameArabic),
    createdAt: new Date(person.createdAt),
    updatedAt: new Date(person.updatedAt),
  };
}

export const databaseRepository: PersonRepository = {
  async listCategories() {
    const db = getDb();
    const rows = await db.select().from(schema.categories).where(eq(schema.categories.status, "published")).orderBy(asc(schema.categories.name));
    return rows.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      status: category.status,
    }));
  },

  async listPublishedPeople() {
    const db = getDb();
    const rows = await db.select().from(schema.people).where(eq(schema.people.status, "published")).orderBy(asc(schema.people.name));
    const records = await Promise.all(rows.map((row) => hydratePerson(db, row)));
    return records.filter((record) => validatePublishedRecord(record).length === 0).map((record) => record.person);
  },

  async getPersonBySlug(slug: string) {
    return getPersonBySlug(getDb(), slug);
  },

  async getPublishedPersonBySlug(slug: string) {
    return getPersonBySlug(getDb(), slug, true);
  },

  async hasPublishedPersonSlug(slug: string) {
    const rows = await getDb()
      .select({ slug: schema.people.slug })
      .from(schema.people)
      .where(and(eq(schema.people.slug, slug), eq(schema.people.status, "published")))
      .limit(1);
    return rows.length > 0;
  },

  async hasPublishedCategorySlug(slug: string) {
    const rows = await getDb()
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(and(eq(schema.categories.slug, slug), eq(schema.categories.status, "published")))
      .limit(1);
    return rows.length > 0;
  },

  async searchPublishedPeople(query: PersonSearchQuery) {
    const records = await searchPublishedPeople(getDb(), query);
    return records.filter((record) => validatePublishedRecord(record).length === 0).map((record) => record.person);
  },

  async listDisplayPeople() {
    return this.listPublishedPeople();
  },

  async createPersonRecord(record: NewPersonRecord) {
    assertValidRecord(record);
    const db = getDb();
    await db.transaction(async (tx) => {
      for (const category of record.categories) {
        await tx.insert(schema.categories).values({
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          status: category.status,
        }).onConflictDoNothing();
      }
      for (const source of record.sources) {
        await tx.insert(schema.sources).values({
          id: source.id,
          title: source.title,
          publisher: source.publisher,
          url: source.url,
          publicationDate: source.publicationDate,
          accessedAt: source.accessedAt,
          sourceType: source.type,
          reliability: source.reliability,
          status: source.status,
        }).onConflictDoNothing();
      }
      await tx.insert(schema.people).values(personInsertValues(record.person));
      if (record.categories.length > 0) {
        await tx.insert(schema.personCategories).values(record.categories.map((category) => ({ personId: record.person.id, categoryId: category.id })));
      }
      if (record.person.occupations.length > 0) {
        await tx.insert(schema.personOccupations).values(record.person.occupations.map((occupation) => ({ personId: record.person.id, occupation, occupationNormalized: normalizeArabic(occupation) })));
      }
      if (record.sources.length > 0) {
        await tx.insert(schema.personSources).values(record.sources.map((source) => ({ personId: record.person.id, sourceId: source.id })));
      }
      for (const event of record.timeline) {
        await tx.insert(schema.timelineEvents).values({ id: event.id, personId: event.personId, eventDate: event.date, title: event.title, description: event.description });
        if (event.sourceIds.length > 0) await tx.insert(schema.timelineEventSources).values(event.sourceIds.map((sourceId) => ({ eventId: event.id, sourceId })));
      }
      for (const item of record.education) {
        await tx.insert(schema.education).values({ id: item.id, personId: item.personId, institution: item.institution, field: item.field, dateRange: item.dateRange, description: item.description });
        if (item.sourceIds.length > 0) await tx.insert(schema.educationSources).values(item.sourceIds.map((sourceId) => ({ educationId: item.id, sourceId })));
      }
    });
    const created = await getPersonBySlug(db, record.person.slug);
    if (!created) throw new Error("Created person could not be reloaded");
    return created;
  },

  async updatePerson(id: string, patch: Partial<Person>) {
    const db = getDb();
    const current = await db.select().from(schema.people).where(eq(schema.people.id, id)).limit(1);
    if (current.length === 0) return null;
    const existing = await hydratePerson(db, current[0]);
    const candidate = { ...existing, person: { ...existing.person, ...patch, updatedAt: new Date().toISOString() } };
    assertValidRecord(candidate);

    await db.transaction(async (tx) => {
      const personPatch = {
        ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.nameArabic !== undefined ? { nameArabic: patch.nameArabic } : {}),
        ...(patch.shortBio !== undefined ? { shortBio: patch.shortBio } : {}),
        ...(patch.biography !== undefined ? { biography: patch.biography } : {}),
        ...(patch.birthDate !== undefined ? { birthDate: patch.birthDate } : {}),
        ...(patch.deathDate !== undefined ? { deathDate: patch.deathDate } : {}),
        ...(patch.birthPlace !== undefined ? { birthPlace: patch.birthPlace } : {}),
        ...(patch.deathPlace !== undefined ? { deathPlace: patch.deathPlace } : {}),
        ...(patch.image !== undefined ? { imageUrl: patch.image } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.name !== undefined ? { searchName: normalizeArabic(patch.name) } : {}),
        ...(patch.nameArabic !== undefined ? { searchNameArabic: normalizeArabic(patch.nameArabic) } : {}),
        updatedAt: new Date(),
      };
      if (Object.keys(personPatch).length > 1) await tx.update(schema.people).set(personPatch).where(eq(schema.people.id, id));
      if (patch.categoryIds) {
        await tx.delete(schema.personCategories).where(eq(schema.personCategories.personId, id));
        if (patch.categoryIds.length > 0) await tx.insert(schema.personCategories).values(patch.categoryIds.map((categoryId) => ({ personId: id, categoryId })));
      }
      if (patch.occupations) {
        await tx.delete(schema.personOccupations).where(eq(schema.personOccupations.personId, id));
        if (patch.occupations.length > 0) await tx.insert(schema.personOccupations).values(patch.occupations.map((occupation) => ({ personId: id, occupation, occupationNormalized: normalizeArabic(occupation) })));
      }
      if (patch.sourceIds) {
        await tx.delete(schema.personSources).where(eq(schema.personSources.personId, id));
        if (patch.sourceIds.length > 0) await tx.insert(schema.personSources).values(patch.sourceIds.map((sourceId) => ({ personId: id, sourceId })));
      }
    });
    return getPersonBySlug(db, patch.slug ?? existing.person.slug);
  },
};
