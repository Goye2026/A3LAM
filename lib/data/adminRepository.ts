import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
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
import type { ContentStatus } from "@/lib/domain/a3lam";
import { normalizeArabic } from "@/lib/domain/search";
import type { AdminCategoryInput, AdminDashboardData, AdminPeoplePage, AdminPersonEditorData, AdminPersonListItem } from "@/lib/admin/types";

export const ADMIN_PAGE_SIZE = 20;

type Database = PostgresJsDatabase<typeof schema>;

type PersonRow = typeof schema.people.$inferSelect;

type CategoryRow = typeof schema.categories.$inferSelect;


function asIsoDate(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function asIsoTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
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
    image: row.imageUrl,
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

function assertEditableRecord(record: PersonRecord) {
  const categoryIds = new Set(record.categories.map((category) => category.id));
  const sourceIds = new Set(record.sources.map((source) => source.id));
  const issues = record.person.status === "published"
    ? validatePublishedRecord(record)
    : record.person.status === "draft"
      ? [
          ...record.categories.flatMap(validateCategory),
          ...record.sources.flatMap(validateSource),
          ...record.timeline.flatMap((event) => validateTimelineEvent(event, sourceIds)),
          ...record.education.flatMap((item) => validateEducation(item, sourceIds)),
        ]
      : [
          ...record.categories.flatMap(validateCategory),
          ...record.sources.flatMap(validateSource),
          ...validatePerson(record.person, { knownCategoryIds: categoryIds, knownSourceIds: sourceIds }),
          ...record.timeline.flatMap((event) => validateTimelineEvent(event, sourceIds)),
          ...record.education.flatMap((item) => validateEducation(item, sourceIds)),
        ];
  if (issues.length > 0) {
    const error = new Error("The submitted editorial record is invalid");
    error.name = "AdminValidationError";
    throw error;
  }
}

function assertTransition(current: ContentStatus, next: ContentStatus) {
  const allowed: Record<ContentStatus, ContentStatus[]> = {
    draft: ["draft", "review"],
    review: ["draft", "review", "published"],
    published: ["review", "published", "archived"],
    archived: ["review", "archived"],
  };
  if (!allowed[current].includes(next)) {
    const error = new Error("This status transition is not allowed");
    error.name = "AdminConflictError";
    throw error;
  }
}

function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status,
  };
}

function assertCategory(category: Category) {
  if (validateCategory(category).length > 0) {
    const error = new Error("The submitted category is invalid");
    error.name = "AdminValidationError";
    throw error;
  }
}

function listItem(row: PersonRow, categories: string[]): AdminPersonListItem {
  return {
    id: row.id,
    slug: row.slug,
    nameArabic: row.nameArabic,
    name: row.name,
    status: row.status,
    categories,
    createdAt: asIsoTimestamp(row.createdAt),
    updatedAt: asIsoTimestamp(row.updatedAt),
  };
}

async function listCategoriesForPeople(db: Database, personIds: string[]) {
  if (personIds.length === 0) return new Map<string, string[]>();
  const rows = await db
    .select({ personId: schema.personCategories.personId, name: schema.categories.name })
    .from(schema.personCategories)
    .innerJoin(schema.categories, eq(schema.personCategories.categoryId, schema.categories.id))
    .where(inArray(schema.personCategories.personId, personIds));
  const result = new Map<string, string[]>();
  for (const row of rows) result.set(row.personId, [...(result.get(row.personId) ?? []), row.name]);
  return result;
}

export const adminRepository = {
  async getDashboard(): Promise<AdminDashboardData> {
    const db = getDb();
    const countRows = await db
      .select({ status: schema.people.status, count: sql<string>`count(*)` })
      .from(schema.people)
      .groupBy(schema.people.status);
    const counts: Record<ContentStatus, number> = { draft: 0, review: 0, published: 0, archived: 0 };
    for (const row of countRows) counts[row.status] = Number(row.count);
    const recentRows = await db.select().from(schema.people).orderBy(desc(schema.people.updatedAt)).limit(5);
    const categoryMap = await listCategoriesForPeople(db, recentRows.map((row) => row.id));
    return { counts, recent: recentRows.map((row) => listItem(row, categoryMap.get(row.id) ?? [])) };
  },

  async listPeople(options: { page?: number; pageSize?: number; query?: string; status?: ContentStatus | "" } = {}): Promise<AdminPeoplePage> {
    const db = getDb();
    const pageSize = Math.min(Math.max(options.pageSize ?? ADMIN_PAGE_SIZE, 1), 100);
    const page = Math.max(options.page ?? 1, 1);
    const conditions = [];
    const query = options.query?.trim();
    if (query) {
      const pattern = `%${normalizeArabic(query)}%`;
      conditions.push(sql`(${ilike(schema.people.searchNameArabic, pattern)} OR ${ilike(schema.people.searchName, pattern)} OR ${ilike(schema.people.slug, pattern)})`);
    }
    if (options.status) conditions.push(eq(schema.people.status, options.status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, totalRows] = await Promise.all([
      db.select().from(schema.people).where(where).orderBy(desc(schema.people.updatedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<string>`count(*)` }).from(schema.people).where(where),
    ]);
    const categoryMap = await listCategoriesForPeople(db, rows.map((row) => row.id));
    return {
      items: rows.map((row) => listItem(row, categoryMap.get(row.id) ?? [])),
      total: Number(totalRows[0]?.count ?? 0),
      page,
      pageSize,
      status: options.status ?? "",
      query: query ?? "",
    };
  },

  async getEditorData(id: string): Promise<AdminPersonEditorData | null> {
    const db = getDb();
    const rows = await db.select().from(schema.people).where(eq(schema.people.id, id)).limit(1);
    if (rows.length === 0) return null;
    const [record, categoryRows] = await Promise.all([
      hydratePerson(db, rows[0]),
      db.select().from(schema.categories).orderBy(asc(schema.categories.name)),
    ]);
    return { record, categories: categoryRows.map(categoryFromRow) };
  },

  async listCategoryOptions() {
    const db = getDb();
    const rows = await db.select().from(schema.categories).orderBy(asc(schema.categories.name));
    return rows.map(categoryFromRow);
  },

  async getCategory(id: string) {
    const db = getDb();
    const rows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    return rows[0] ? categoryFromRow(rows[0]) : null;
  },

  async createCategory(input: AdminCategoryInput) {
    const category: Category = { id: randomUUID(), slug: input.slug, name: input.name, description: input.description, status: input.status };
    assertCategory(category);
    const db = getDb();
    await db.insert(schema.categories).values({ id: category.id, slug: category.slug, name: category.name, description: category.description, status: category.status });
    return category;
  },

  async updateCategory(id: string, input: AdminCategoryInput) {
    const current = await this.getCategory(id);
    if (!current) return null;
    const category: Category = { id, slug: input.slug, name: input.name, description: input.description, status: current.status };
    assertCategory(category);
    const db = getDb();
    await db.update(schema.categories).set({ slug: category.slug, name: category.name, description: category.description, updatedAt: new Date() }).where(eq(schema.categories.id, id));
    return category;
  },

  async getPersonStatus(id: string) {
    const db = getDb();
    const rows = await db.select({ status: schema.people.status }).from(schema.people).where(eq(schema.people.id, id)).limit(1);
    return rows[0]?.status ?? null;
  },

  async createRecord(record: PersonRecord) {
    assertEditableRecord(record);
    const db = getDb();
    await db.transaction(async (tx) => {
      const categoryRows = await tx.select({ id: schema.categories.id }).from(schema.categories).where(inArray(schema.categories.id, record.person.categoryIds));
      if (categoryRows.length !== record.person.categoryIds.length) throw new Error("Unknown category relationship");
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
        }).onConflictDoUpdate({ target: schema.sources.id, set: { title: source.title, publisher: source.publisher, url: source.url, publicationDate: source.publicationDate, accessedAt: source.accessedAt, sourceType: source.type, reliability: source.reliability, status: source.status, updatedAt: new Date() } });
      }
      await tx.insert(schema.people).values({
        id: record.person.id,
        slug: record.person.slug,
        name: record.person.name,
        nameArabic: record.person.nameArabic,
        shortBio: record.person.shortBio,
        biography: record.person.biography,
        birthDate: record.person.birthDate,
        deathDate: record.person.deathDate,
        birthPlace: record.person.birthPlace,
        deathPlace: record.person.deathPlace,
        imageUrl: record.person.image,
        status: record.person.status,
        searchName: normalizeArabic(record.person.name),
        searchNameArabic: normalizeArabic(record.person.nameArabic),
        createdAt: new Date(record.person.createdAt),
        updatedAt: new Date(record.person.updatedAt),
      });
      if (record.person.categoryIds.length > 0) await tx.insert(schema.personCategories).values(record.person.categoryIds.map((categoryId) => ({ personId: record.person.id, categoryId })));
      if (record.person.occupations.length > 0) await tx.insert(schema.personOccupations).values(record.person.occupations.map((occupation) => ({ personId: record.person.id, occupation, occupationNormalized: normalizeArabic(occupation) })));
      if (record.person.sourceIds.length > 0) await tx.insert(schema.personSources).values(record.person.sourceIds.map((sourceId) => ({ personId: record.person.id, sourceId })));
      for (const event of record.timeline) {
        await tx.insert(schema.timelineEvents).values({ id: event.id, personId: record.person.id, eventDate: event.date, title: event.title, description: event.description });
        if (event.sourceIds.length > 0) await tx.insert(schema.timelineEventSources).values(event.sourceIds.map((sourceId) => ({ eventId: event.id, sourceId })));
      }
      for (const item of record.education) {
        await tx.insert(schema.education).values({ id: item.id, personId: record.person.id, institution: item.institution, field: item.field, dateRange: item.dateRange, description: item.description });
        if (item.sourceIds.length > 0) await tx.insert(schema.educationSources).values(item.sourceIds.map((sourceId) => ({ educationId: item.id, sourceId })));
      }
    });
    return this.getEditorData(record.person.id);
  },

  async transitionStatus(id: string, nextStatus: ContentStatus) {
    const db = getDb();
    const editor = await this.getEditorData(id);
    if (!editor) return null;
    assertTransition(editor.record.person.status, nextStatus);
    const candidate: PersonRecord = {
      ...editor.record,
      person: { ...editor.record.person, status: nextStatus, updatedAt: new Date().toISOString() },
      sources: nextStatus === "published" ? editor.record.sources.map((source) => ({ ...source, status: "published" as const })) : editor.record.sources,
    };
    assertEditableRecord(candidate);
    await db.transaction(async (tx) => {
      await tx.update(schema.people).set({ status: nextStatus, updatedAt: new Date() }).where(eq(schema.people.id, id));
      if (nextStatus === "published" && editor.record.sources.length > 0) {
        await tx.update(schema.sources).set({ status: "published", updatedAt: new Date() }).where(inArray(schema.sources.id, editor.record.sources.map((source) => source.id)));
      }
    });
    return this.getEditorData(id);
  },

  async replaceRecord(id: string, record: PersonRecord) {
    const db = getDb();
    const currentRows = await db.select().from(schema.people).where(eq(schema.people.id, id)).limit(1);
    if (currentRows.length === 0) return null;
    if (record.person.id !== id) throw new Error("Person identity cannot change");
    assertTransition(currentRows[0].status, record.person.status);
    assertEditableRecord(record);
    await db.transaction(async (tx) => {
      const categoryRows = await tx.select({ id: schema.categories.id }).from(schema.categories).where(inArray(schema.categories.id, record.person.categoryIds));
      if (categoryRows.length !== record.person.categoryIds.length) throw new Error("Unknown category relationship");
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
        }).onConflictDoUpdate({ target: schema.sources.id, set: { title: source.title, publisher: source.publisher, url: source.url, publicationDate: source.publicationDate, accessedAt: source.accessedAt, sourceType: source.type, reliability: source.reliability, status: source.status, updatedAt: new Date() } });
      }
      await tx.update(schema.people).set({
        slug: record.person.slug,
        name: record.person.name,
        nameArabic: record.person.nameArabic,
        shortBio: record.person.shortBio,
        biography: record.person.biography,
        birthDate: record.person.birthDate,
        deathDate: record.person.deathDate,
        birthPlace: record.person.birthPlace,
        deathPlace: record.person.deathPlace,
        imageUrl: record.person.image,
        status: record.person.status,
        searchName: normalizeArabic(record.person.name),
        searchNameArabic: normalizeArabic(record.person.nameArabic),
        updatedAt: new Date(record.person.updatedAt),
      }).where(eq(schema.people.id, id));
      await tx.delete(schema.personCategories).where(eq(schema.personCategories.personId, id));
      await tx.delete(schema.personOccupations).where(eq(schema.personOccupations.personId, id));
      await tx.delete(schema.personSources).where(eq(schema.personSources.personId, id));
      await tx.delete(schema.timelineEvents).where(eq(schema.timelineEvents.personId, id));
      await tx.delete(schema.education).where(eq(schema.education.personId, id));
      if (record.person.categoryIds.length > 0) await tx.insert(schema.personCategories).values(record.person.categoryIds.map((categoryId) => ({ personId: id, categoryId })));
      if (record.person.occupations.length > 0) await tx.insert(schema.personOccupations).values(record.person.occupations.map((occupation) => ({ personId: id, occupation, occupationNormalized: normalizeArabic(occupation) })));
      if (record.person.sourceIds.length > 0) await tx.insert(schema.personSources).values(record.person.sourceIds.map((sourceId) => ({ personId: id, sourceId })));
      for (const event of record.timeline) {
        await tx.insert(schema.timelineEvents).values({ id: event.id, personId: id, eventDate: event.date, title: event.title, description: event.description });
        if (event.sourceIds.length > 0) await tx.insert(schema.timelineEventSources).values(event.sourceIds.map((sourceId) => ({ eventId: event.id, sourceId })));
      }
      for (const item of record.education) {
        await tx.insert(schema.education).values({ id: item.id, personId: id, institution: item.institution, field: item.field, dateRange: item.dateRange, description: item.description });
        if (item.sourceIds.length > 0) await tx.insert(schema.educationSources).values(item.sourceIds.map((sourceId) => ({ educationId: item.id, sourceId })));
      }
    });
    return this.getEditorData(id);
  },

};
