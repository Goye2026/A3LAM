import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
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
import type { ContentStatus, ProfileStatus } from "@/lib/domain/a3lam";
import { normalizeArabic } from "@/lib/domain/search";
import { ADMIN_PERMISSIONS, applyPermissionOverrides, canSoleSuperAdminRetainCorePermissions, permissionListForRole } from "@/lib/admin/rbac";
import { calculateProfileCompletion, getProfileForUser } from "@/lib/user/profileRepository";
import { ADMIN_ROLE_CODES, type AdminAccountStatus, type AdminAuditLogItem, type AdminCategoryInput, type AdminCategorySummary, type AdminControlCenterSummary, type AdminDashboardData, type AdminEffectivePermissions, type AdminIdentitySummary, type AdminPermissionCode, type AdminUserDetail, type AdminPermissionOverrideSummary, type AdminPeoplePage, type AdminPersonEditorData, type AdminPersonListItem, type AdminRoleCode, type AdminSessionSummary, type AdminUserSummary } from "@/lib/admin/types";

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
  async getControlCenterSummary(): Promise<AdminControlCenterSummary> {
    const db = getDb();
    const [peopleRows, categoryRows, userRows, activeUserRows, profileRows, recentAuditRows] = await Promise.all([
      db.select({ count: sql<string>`count(*)` }).from(schema.people),
      db.select({ count: sql<string>`count(*)` }).from(schema.categories),
      db.select({ count: sql<string>`count(*)` }).from(schema.userAccounts),
      db.select({ count: sql<string>`count(*)` }).from(schema.userAccounts).where(isNull(schema.userAccounts.disabledAt)),
      db.select({ status: schema.profiles.status, count: sql<string>`count(*)` }).from(schema.profiles).groupBy(schema.profiles.status),
      db.select({ id: schema.auditLogs.id, actorType: schema.auditLogs.actorType, actorId: schema.auditLogs.actorId, entityType: schema.auditLogs.entityType, entityId: schema.auditLogs.entityId, field: schema.auditLogs.field, action: schema.auditLogs.action, createdAt: schema.auditLogs.createdAt }).from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(5),
    ]);
    let adminIdentities: number | null = null;
    let editors: number | null = null;
    let adminSessions: number | null = null;
    try {
      const [adminRows, editorRows, sessionRows] = await Promise.all([
        db.select({ count: sql<string>`count(*)` }).from(schema.adminIdentities),
        db.select({ count: sql<string>`count(*)` }).from(schema.adminRoleAssignments).where(eq(schema.adminRoleAssignments.roleCode, "EDITOR")),
        db.select({ count: sql<string>`count(*)` }).from(schema.adminSessions).where(and(isNull(schema.adminSessions.revokedAt), gt(schema.adminSessions.expiresAt, new Date()))),
      ]);
      adminIdentities = Number(adminRows[0]?.count ?? 0);
      editors = Number(editorRows[0]?.count ?? 0);
      adminSessions = Number(sessionRows[0]?.count ?? 0);
    } catch {
      // Phase 17.0 remains usable before the Phase 17.1 schema migration is applied.
    }
    const profiles = { total: 0, pendingReview: 0, published: 0, draft: 0 };
    for (const row of profileRows) {
      const count = Number(row.count);
      profiles.total += count;
      if (row.status === "pending_review") profiles.pendingReview = count;
      if (row.status === "published") profiles.published = count;
      if (row.status === "draft") profiles.draft = count;
    }
    return {
      people: Number(peopleRows[0]?.count ?? 0),
      categories: Number(categoryRows[0]?.count ?? 0),
      users: Number(userRows[0]?.count ?? 0),
      activeUsers: Number(activeUserRows[0]?.count ?? 0),
      profiles,
      adminIdentities,
      editors,
      adminSessions,
      recentAudit: recentAuditRows.map((row) => ({ ...row, createdAt: asIsoTimestamp(row.createdAt) })),
    };
  },

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

  async listPeople(options: { page?: number; pageSize?: number; query?: string; status?: ContentStatus | ""; categoryId?: string; sort?: "updated_desc" | "updated_asc" | "name" } = {}): Promise<AdminPeoplePage> {
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
    if (options.categoryId) conditions.push(sql`exists (select 1 from ${schema.personCategories} pc where pc.person_id = ${schema.people.id} and pc.category_id = ${options.categoryId})`);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderBy = options.sort === "name" ? asc(schema.people.nameArabic) : options.sort === "updated_asc" ? asc(schema.people.updatedAt) : desc(schema.people.updatedAt);
    const [rows, totalRows] = await Promise.all([
      db.select().from(schema.people).where(where).orderBy(orderBy).limit(pageSize).offset((page - 1) * pageSize),
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

  async listCategorySummaries(options: { query?: string; status?: ContentStatus | "" } = {}): Promise<AdminCategorySummary[]> {
    const db = getDb();
    const conditions = [];
    const query = options.query?.trim();
    if (query) conditions.push(sql`(${ilike(schema.categories.name, `%${query}%`)} OR ${ilike(schema.categories.slug, `%${query}%`)})`);
    if (options.status) conditions.push(eq(schema.categories.status, options.status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [categoryRows, peopleCounts, profileCounts] = await Promise.all([
      db.select().from(schema.categories).where(where).orderBy(asc(schema.categories.name)),
      db.select({ categoryId: schema.personCategories.categoryId, count: sql<string>`count(*)` }).from(schema.personCategories).groupBy(schema.personCategories.categoryId),
      db.select({ categoryId: schema.profileCategories.categoryId, count: sql<string>`count(*)` }).from(schema.profileCategories).groupBy(schema.profileCategories.categoryId),
    ]);
    const peopleMap = new Map(peopleCounts.map((row) => [row.categoryId, Number(row.count)]));
    const profileMap = new Map(profileCounts.map((row) => [row.categoryId, Number(row.count)]));
    return categoryRows.map((row) => ({ ...categoryFromRow(row), peopleCount: peopleMap.get(row.id) ?? 0, profileCount: profileMap.get(row.id) ?? 0 }));
  },

  async getCategory(id: string) {
    const db = getDb();
    const rows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    return rows[0] ? categoryFromRow(rows[0]) : null;
  },

  async createCategory(input: AdminCategoryInput, actorId: string | null = null) {
    const category: Category = { id: randomUUID(), slug: input.slug, name: input.name, description: input.description, status: input.status };
    assertCategory(category);
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.insert(schema.categories).values({ id: category.id, slug: category.slug, name: category.name, description: category.description, status: category.status });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "category", entityId: category.id, field: "record", oldValue: null, newValue: category.slug, action: "create_category", reason: null });
    });
    return category;
  },

  async updateCategory(id: string, input: AdminCategoryInput, actorId: string | null = null) {
    const current = await this.getCategory(id);
    if (!current) return null;
    const category: Category = { id, slug: input.slug, name: input.name, description: input.description, status: current.status };
    assertCategory(category);
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.update(schema.categories).set({ slug: category.slug, name: category.name, description: category.description, updatedAt: new Date() }).where(eq(schema.categories.id, id));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "category", entityId: id, field: "record", oldValue: current.slug, newValue: category.slug, action: "update_category", reason: null });
    });
    return category;
  },

  async listUserSummaries(options: { query?: string; profileStatus?: ProfileStatus | ""; limit?: number } = {}): Promise<AdminUserSummary[]> {
    const db = getDb();
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const query = options.query?.trim();
    const conditions = [];
    if (query) conditions.push(ilike(schema.userAccounts.name, `%${query}%`));
    if (options.profileStatus) conditions.push(eq(schema.profiles.status, options.profileStatus));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db
      .select({ user: schema.userAccounts, profile: schema.profiles })
      .from(schema.userAccounts)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.userAccounts.id))
      .where(where)
      .orderBy(desc(schema.userAccounts.createdAt))
      .limit(limit);
    return rows.map(({ user, profile }) => ({
      id: user.id,
      name: user.name,
      createdAt: asIsoTimestamp(user.createdAt),
      lastSignedIn: user.lastSignedIn ? asIsoTimestamp(user.lastSignedIn) : null,
      profile: profile ? { id: profile.id, nameArabic: profile.nameArabic, status: profile.status, visibility: profile.visibility } : null,
    }));
  },

  async listAuditLogs(options: { actor?: string; action?: string; entityType?: string; entityId?: string; from?: string; to?: string; limit?: number } = {}): Promise<AdminAuditLogItem[]> {
    const db = getDb();
    const conditions = [];
    if (options.actor?.trim()) conditions.push(or(eq(schema.auditLogs.actorId, options.actor.trim()), eq(schema.auditLogs.actorType, options.actor.trim())));
    if (options.action?.trim()) conditions.push(ilike(schema.auditLogs.action, `%${options.action.trim()}%`));
    if (options.entityType?.trim()) conditions.push(eq(schema.auditLogs.entityType, options.entityType.trim()));
    if (options.entityId?.trim()) conditions.push(eq(schema.auditLogs.entityId, options.entityId.trim()));
    if (options.from && !Number.isNaN(new Date(options.from).getTime())) conditions.push(gte(schema.auditLogs.createdAt, new Date(options.from)));
    if (options.to && !Number.isNaN(new Date(options.to).getTime())) conditions.push(lte(schema.auditLogs.createdAt, new Date(options.to)));
    const rows = await db.select({
      id: schema.auditLogs.id,
      actorType: schema.auditLogs.actorType,
      actorId: schema.auditLogs.actorId,
      entityType: schema.auditLogs.entityType,
      entityId: schema.auditLogs.entityId,
      field: schema.auditLogs.field,
      action: schema.auditLogs.action,
      createdAt: schema.auditLogs.createdAt,
    }).from(schema.auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(schema.auditLogs.createdAt)).limit(Math.min(Math.max(options.limit ?? 100, 1), 100));
    return rows.map((row) => ({ ...row, createdAt: asIsoTimestamp(row.createdAt) }));
  },

  async getSystemStatus() {
    try {
      const db = getDb();
      await db.execute(sql`select 1`);
      return { database: "available" as const };
    } catch {
      return { database: "unavailable" as const };
    }
  },

  async getPersonStatus(id: string) {
    const db = getDb();
    const rows = await db.select({ status: schema.people.status }).from(schema.people).where(eq(schema.people.id, id)).limit(1);
    return rows[0]?.status ?? null;
  },

  async createRecord(record: PersonRecord, actorId: string | null = null) {
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
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "person", entityId: record.person.id, field: "record", oldValue: null, newValue: record.person.slug, action: "create_person", reason: null });
    });
    return this.getEditorData(record.person.id);
  },

  async transitionStatus(id: string, nextStatus: ContentStatus, actorId: string | null = null) {
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
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "person", entityId: id, field: "status", oldValue: editor.record.person.status, newValue: nextStatus, action: "transition_person", reason: null });
    });
    return this.getEditorData(id);
  },

  async listAdminUsers(options: { query?: string; disabled?: "active" | "disabled" | ""; profileStatus?: ProfileStatus | ""; visibility?: "private" | "unlisted" | "published" | ""; hasProfile?: "yes" | "no" | ""; limit?: number } = {}) {
    const db = getDb();
    const conditions = [];
    const query = options.query?.trim();
    if (query) conditions.push(or(ilike(schema.userAccounts.name, `%${query}%`), ilike(schema.userAccounts.email, `%${query}%`), ilike(schema.profiles.slug, `%${query}%`), ilike(schema.profiles.professionalTitle, `%${query}%`)));
    if (options.disabled === "active") conditions.push(isNull(schema.userAccounts.disabledAt));
    if (options.disabled === "disabled") conditions.push(sql`${schema.userAccounts.disabledAt} IS NOT NULL`);
    if (options.profileStatus) conditions.push(eq(schema.profiles.status, options.profileStatus));
    if (options.visibility) conditions.push(eq(schema.profiles.visibility, options.visibility));
    if (options.hasProfile === "yes") conditions.push(isNotNull(schema.profiles.id));
    if (options.hasProfile === "no") conditions.push(isNull(schema.profiles.id));
    const completionPercent = sql<number>`round((
      (case when ${schema.profiles.name} <> '' and ${schema.profiles.nameArabic} <> '' and ${schema.profiles.slug} <> '' then 1 else 0 end) +
      (case when ${schema.profiles.imageUrl} is not null and ${schema.profiles.imageUrl} <> '' then 1 else 0 end) +
      (case when ${schema.profiles.professionalTitle} <> '' and (${schema.profiles.professionalSummary} <> '' or ${schema.profiles.biography} <> '') then 1 else 0 end) +
      (case when exists (select 1 from profile_experiences pe where pe.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_educations ped where ped.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_skills ps where ps.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_certifications pc where pc.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_languages pl where pl.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_portfolio_items pp where pp.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_social_links psl where psl.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when ${schema.profiles.contactEmail} is not null or ${schema.profiles.phone} is not null or exists (select 1 from profile_social_links psl2 where psl2.profile_id = ${schema.profiles.id}) then 1 else 0 end) +
      (case when exists (select 1 from profile_source_records psr where psr.profile_id = ${schema.profiles.id}) then 1 else 0 end)
    ) * 100 / 12)`;
    const rows = await db.select({
      user: schema.userAccounts,
      profileId: schema.profiles.id,
      profileNameArabic: schema.profiles.nameArabic,
      profileStatus: schema.profiles.status,
      profileVisibility: schema.profiles.visibility,
      completionPercent,
      activeSessions: sql<number>`count(${schema.userSessions.id})`,
    }).from(schema.userAccounts)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.userAccounts.id))
      .leftJoin(schema.userSessions, and(eq(schema.userSessions.userId, schema.userAccounts.id), isNull(schema.userSessions.revokedAt), gt(schema.userSessions.expiresAt, new Date())))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(schema.userAccounts.id, schema.profiles.id)
      .orderBy(desc(schema.userAccounts.createdAt))
      .limit(Math.min(Math.max(options.limit ?? 100, 1), 100));
    return rows.map(({ user, profileId, profileNameArabic, profileStatus, profileVisibility, completionPercent, activeSessions }) => ({ id: user.id, name: user.name, email: user.email, createdAt: asIsoTimestamp(user.createdAt), lastSignedIn: user.lastSignedIn ? asIsoTimestamp(user.lastSignedIn) : null, accountStatus: user.disabledAt ? "disabled" as const : "active" as const, activeSessions: Number(activeSessions ?? 0), profileStatus: profileStatus ?? null, visibility: profileVisibility ?? null, completionPercent: profileId ? Number(completionPercent ?? 0) : null, profile: profileId ? { id: profileId, nameArabic: profileNameArabic ?? "", status: profileStatus ?? "draft", visibility: profileVisibility ?? "private" } : null }));
  },

  async getAdminUserDetail(id: string): Promise<AdminUserDetail | null> {
    const db = getDb();
    const userRows = await db.select().from(schema.userAccounts).where(eq(schema.userAccounts.id, id)).limit(1);
    const user = userRows[0];
    if (!user) return null;
    const profile = await getProfileForUser(user.id);
    const [sessionRows, auditRows] = await Promise.all([
      db.select({ id: schema.userSessions.id, createdAt: schema.userSessions.createdAt, expiresAt: schema.userSessions.expiresAt }).from(schema.userSessions).where(and(eq(schema.userSessions.userId, user.id), isNull(schema.userSessions.revokedAt), gt(schema.userSessions.expiresAt, new Date()))).orderBy(desc(schema.userSessions.createdAt)).limit(100),
      db.select({ id: schema.auditLogs.id, actorType: schema.auditLogs.actorType, actorId: schema.auditLogs.actorId, entityType: schema.auditLogs.entityType, entityId: schema.auditLogs.entityId, field: schema.auditLogs.field, action: schema.auditLogs.action, createdAt: schema.auditLogs.createdAt }).from(schema.auditLogs).where(profile ? or(and(eq(schema.auditLogs.entityType, "user_account"), eq(schema.auditLogs.entityId, user.id)), and(eq(schema.auditLogs.entityType, "profile"), eq(schema.auditLogs.entityId, profile.profile.id))) : and(eq(schema.auditLogs.entityType, "user_account"), eq(schema.auditLogs.entityId, user.id))).orderBy(desc(schema.auditLogs.createdAt)).limit(100),
    ]);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountStatus: user.disabledAt ? "disabled" : "active",
      createdAt: asIsoTimestamp(user.createdAt),
      lastSignedIn: user.lastSignedIn ? asIsoTimestamp(user.lastSignedIn) : null,
      profile: profile ? { id: profile.profile.id, slug: profile.profile.slug, name: profile.profile.name, nameArabic: profile.profile.nameArabic, status: profile.profile.status, visibility: profile.profile.visibility, completion: calculateProfileCompletion(profile) } : null,
      sessions: sessionRows.map((session) => ({ id: session.id, createdAt: asIsoTimestamp(session.createdAt), expiresAt: asIsoTimestamp(session.expiresAt) })),
      audit: auditRows.map((row) => ({ ...row, createdAt: asIsoTimestamp(row.createdAt) })),
    };
  },

  async setUserDisabled(id: string, disabled: boolean, actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const currentRows = await tx.select({ id: schema.userAccounts.id, disabledAt: schema.userAccounts.disabledAt }).from(schema.userAccounts).where(eq(schema.userAccounts.id, id)).limit(1);
      const current = currentRows[0];
      if (!current) return null;
      const now = new Date();
      const rows = await tx.update(schema.userAccounts).set({ disabledAt: disabled ? now : null, updatedAt: now }).where(eq(schema.userAccounts.id, id)).returning({ id: schema.userAccounts.id, disabledAt: schema.userAccounts.disabledAt });
      if (disabled) await tx.update(schema.userSessions).set({ revokedAt: now }).where(and(eq(schema.userSessions.userId, id), isNull(schema.userSessions.revokedAt)));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "user_account", entityId: id, field: "disabled_at", oldValue: current.disabledAt?.toISOString() ?? null, newValue: disabled ? now.toISOString() : null, action: disabled ? "disable_user" : "enable_user", reason: null, createdAt: now });
      return { id: rows[0].id, accountStatus: rows[0].disabledAt ? "disabled" as const : "active" as const };
    });
  },

  async revokeUserSessions(userId: string, actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const account = await tx.select({ id: schema.userAccounts.id }).from(schema.userAccounts).where(eq(schema.userAccounts.id, userId)).limit(1);
      if (!account[0]) return null;
      const now = new Date();
      const rows = await tx.update(schema.userSessions).set({ revokedAt: now }).where(and(eq(schema.userSessions.userId, userId), isNull(schema.userSessions.revokedAt))).returning({ id: schema.userSessions.id });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "user_account", entityId: userId, field: "sessions", oldValue: String(rows.length), newValue: "0", action: "revoke_user_sessions", reason: null, createdAt: now });
      return rows.length;
    });
  },

  async listAdminIdentities(options: { query?: string; status?: AdminAccountStatus | ""; role?: AdminRoleCode | ""; limit?: number } = {}): Promise<AdminIdentitySummary[]> {
    const db = getDb();
    const query = options.query?.trim();
    const conditions = [];
    if (query) conditions.push(or(ilike(schema.adminIdentities.displayName, `%${query}%`), ilike(schema.adminIdentities.email, `%${query}%`)));
    if (options.status) conditions.push(eq(schema.adminIdentities.status, options.status));
    if (options.role) conditions.push(eq(schema.adminRoleAssignments.roleCode, options.role));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select({
      identity: schema.adminIdentities,
      roleCode: schema.adminRoleAssignments.roleCode,
      activeSessions: sql<number>`count(${schema.adminSessions.id})`,
    }).from(schema.adminIdentities)
      .leftJoin(schema.adminRoleAssignments, eq(schema.adminRoleAssignments.adminId, schema.adminIdentities.id))
      .leftJoin(schema.adminSessions, and(eq(schema.adminSessions.adminId, schema.adminIdentities.id), isNull(schema.adminSessions.revokedAt), gt(schema.adminSessions.expiresAt, new Date())))
      .where(where)
      .groupBy(schema.adminIdentities.id, schema.adminRoleAssignments.roleCode)
      .orderBy(desc(schema.adminIdentities.createdAt))
      .limit(Math.min(Math.max(options.limit ?? 100, 1), 100));
    return rows.map(({ identity, roleCode, activeSessions }) => ({
      id: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      role: (roleCode as AdminRoleCode | null),
      status: identity.status,
      lastSignedIn: identity.lastSignedIn ? asIsoTimestamp(identity.lastSignedIn) : null,
      lastActivityAt: identity.lastActivityAt ? asIsoTimestamp(identity.lastActivityAt) : null,
      createdAt: asIsoTimestamp(identity.createdAt),
      updatedAt: asIsoTimestamp(identity.updatedAt),
      activeSessions: Number(activeSessions ?? 0),
    }));
  },

  async getAdminIdentity(id: string) {
    const db = getDb();
    const rows = await db.select({
      identity: schema.adminIdentities,
      roleCode: schema.adminRoleAssignments.roleCode,
      activeSessions: sql<number>`count(${schema.adminSessions.id})`,
    }).from(schema.adminIdentities)
      .leftJoin(schema.adminRoleAssignments, eq(schema.adminRoleAssignments.adminId, schema.adminIdentities.id))
      .leftJoin(schema.adminSessions, and(eq(schema.adminSessions.adminId, schema.adminIdentities.id), isNull(schema.adminSessions.revokedAt), gt(schema.adminSessions.expiresAt, new Date())))
      .where(eq(schema.adminIdentities.id, id))
      .groupBy(schema.adminIdentities.id, schema.adminRoleAssignments.roleCode)
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { id: row.identity.id, email: row.identity.email, displayName: row.identity.displayName, role: row.roleCode as AdminRoleCode | null, status: row.identity.status, lastSignedIn: row.identity.lastSignedIn ? asIsoTimestamp(row.identity.lastSignedIn) : null, lastActivityAt: row.identity.lastActivityAt ? asIsoTimestamp(row.identity.lastActivityAt) : null, createdAt: asIsoTimestamp(row.identity.createdAt), updatedAt: asIsoTimestamp(row.identity.updatedAt), activeSessions: Number(row.activeSessions ?? 0) };
  },

  async getAdminEffectivePermissions(id: string): Promise<AdminEffectivePermissions | null> {
    const identity = await this.getAdminIdentity(id);
    if (!identity) return null;
    const db = getDb();
    const rows = await db.select({ permissionCode: schema.adminPermissionOverrides.permissionCode, effect: schema.adminPermissionOverrides.effect, assignedBy: schema.adminPermissionOverrides.assignedBy, assignedAt: schema.adminPermissionOverrides.assignedAt }).from(schema.adminPermissionOverrides).where(eq(schema.adminPermissionOverrides.adminId, id)).orderBy(asc(schema.adminPermissionOverrides.permissionCode));
    const overrides: AdminPermissionOverrideSummary[] = rows.map((row) => ({ permissionCode: row.permissionCode, effect: row.effect, assignedBy: row.assignedBy, assignedAt: asIsoTimestamp(row.assignedAt) }));
    const defaults = identity.role ? permissionListForRole(identity.role) : [];
    const effective = identity.role ? [...applyPermissionOverrides(identity.role, overrides as { permissionCode: (typeof ADMIN_PERMISSIONS)[number]; effect: "allow" | "deny" }[])] : [];
    return { adminId: id, role: identity.role, defaults, overrides, effective };
  },

  async replaceAdminPermissionOverrides(id: string, overrides: { permissionCode: AdminPermissionCode; effect: "allow" | "deny" }[], actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const identityRows = await tx.select({ id: schema.adminIdentities.id, status: schema.adminIdentities.status }).from(schema.adminIdentities).where(eq(schema.adminIdentities.id, id)).limit(1);
      if (!identityRows[0]) return null;
      const assignmentRows = await tx.select({ roleCode: schema.adminRoleAssignments.roleCode }).from(schema.adminRoleAssignments).where(eq(schema.adminRoleAssignments.adminId, id)).limit(1);
      const role = assignmentRows[0]?.roleCode as AdminRoleCode | undefined;
      if (!role) {
        const error = new Error("Admin identity has no assigned role");
        error.name = "AdminConflictError";
        throw error;
      }
      if (identityRows[0].status === "active" && role === "SUPER_ADMIN") {
        const activeSuperAdmins = await tx.select({ id: schema.adminIdentities.id }).from(schema.adminIdentities).innerJoin(schema.adminRoleAssignments, eq(schema.adminRoleAssignments.adminId, schema.adminIdentities.id)).where(and(eq(schema.adminIdentities.status, "active"), eq(schema.adminRoleAssignments.roleCode, "SUPER_ADMIN")));
        const effective = applyPermissionOverrides(role, overrides as { permissionCode: (typeof ADMIN_PERMISSIONS)[number]; effect: "allow" | "deny" }[]);
        if (!canSoleSuperAdminRetainCorePermissions(role, activeSuperAdmins.length, effective)) {
          const error = new Error("The final Super Admin must retain core permissions");
          error.name = "AdminConflictError";
          throw error;
        }
      }
      const now = new Date();
      await tx.delete(schema.adminPermissionOverrides).where(eq(schema.adminPermissionOverrides.adminId, id));
      if (overrides.length > 0) await tx.insert(schema.adminPermissionOverrides).values(overrides.map((override) => ({ adminId: id, permissionCode: override.permissionCode, effect: override.effect, assignedBy: actorId, assignedAt: now })));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "permission_overrides", oldValue: null, newValue: JSON.stringify(overrides), action: "update_admin_permissions", reason: null, createdAt: now });
      return { id, count: overrides.length };
    }).then(() => this.getAdminEffectivePermissions(id));
  },

  async createAdminIdentity(input: { email: string; displayName: string; role: AdminRoleCode }, actorId: string | null) {
    const db = getDb();
    const now = new Date();
    const id = randomUUID();
    const email = input.email.trim();
    const displayName = input.displayName.trim();
    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName || displayName.length > 160 || !ADMIN_ROLE_CODES.includes(input.role)) {
      const error = new Error("Invalid admin identity input");
      error.name = "AdminInputError";
      throw error;
    }
    const emailNormalized = email.toLowerCase();
    await db.transaction(async (tx) => {
      await tx.insert(schema.adminIdentities).values({ id, email, emailNormalized, displayName, status: "invited", createdAt: now, updatedAt: now });
      await tx.insert(schema.adminRoleAssignments).values({ adminId: id, roleCode: input.role, assignedBy: actorId, assignedAt: now });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "record", oldValue: null, newValue: JSON.stringify({ role: input.role, status: "invited" }), action: "create_admin_identity", reason: null, createdAt: now });
    });
    return this.getAdminIdentity(id);
  },

  async updateAdminIdentity(id: string, input: { role?: AdminRoleCode; status?: "active" | "disabled"; email?: string; displayName?: string }, actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const identityRows = await tx.select().from(schema.adminIdentities).where(eq(schema.adminIdentities.id, id)).limit(1);
      const current = identityRows[0];
      if (!current) return null;
      const assignmentRows = await tx.select({ roleCode: schema.adminRoleAssignments.roleCode }).from(schema.adminRoleAssignments).where(eq(schema.adminRoleAssignments.adminId, id)).limit(1);
      const currentRole = assignmentRows[0]?.roleCode as AdminRoleCode | undefined;
      if (!input.role && !input.status && !input.email && !input.displayName) {
        const error = new Error("No editable admin identity fields supplied");
        error.name = "AdminInputError";
        throw error;
      }
      if (input.role !== undefined && !ADMIN_ROLE_CODES.includes(input.role)) {
        const error = new Error("Invalid admin role");
        error.name = "AdminInputError";
        throw error;
      }
      if (input.status !== undefined && input.status !== "active" && input.status !== "disabled") {
        const error = new Error("Invalid admin status");
        error.name = "AdminInputError";
        throw error;
      }
      const nextRole = input.role ?? currentRole;
      const nextStatus = input.status ?? current.status;
      const nextEmail = input.email?.trim() ?? current.email;
      const nextDisplayName = input.displayName?.trim() ?? current.displayName;
      if (!nextEmail || nextEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail) || !nextDisplayName || nextDisplayName.length > 160) {
        const error = new Error("Invalid admin identity fields");
        error.name = "AdminInputError";
        throw error;
      }
      if (nextStatus === "active" && !current.passwordHash) {
        const error = new Error("Admin activation requires a configured credential lifecycle");
        error.name = "AdminConflictError";
        throw error;
      }
      if (current.status === "active" && currentRole === "SUPER_ADMIN" && (nextRole !== "SUPER_ADMIN" || nextStatus === "disabled")) {
        const superAdminRows = await tx.select({ id: schema.adminIdentities.id }).from(schema.adminIdentities).innerJoin(schema.adminRoleAssignments, eq(schema.adminRoleAssignments.adminId, schema.adminIdentities.id)).where(and(eq(schema.adminRoleAssignments.roleCode, "SUPER_ADMIN"), eq(schema.adminIdentities.status, "active")));
        if (superAdminRows.length <= 1) {
          const error = new Error("The final Super Admin cannot be disabled or demoted");
          error.name = "AdminConflictError";
          throw error;
        }
      }
      const now = new Date();
      await tx.update(schema.adminIdentities).set({ email: nextEmail, emailNormalized: nextEmail.toLowerCase(), displayName: nextDisplayName, status: nextStatus, updatedAt: now }).where(eq(schema.adminIdentities.id, id));
      if (nextRole) {
        await tx.insert(schema.adminRoleAssignments).values({ adminId: id, roleCode: nextRole, assignedBy: actorId, assignedAt: now }).onConflictDoUpdate({ target: schema.adminRoleAssignments.adminId, set: { roleCode: nextRole, assignedBy: actorId, assignedAt: now } });
      }
      if (current.status !== nextStatus) await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "status", oldValue: current.status, newValue: nextStatus, action: "update_admin_status", reason: null, createdAt: now });
      if (currentRole !== nextRole) await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "role", oldValue: currentRole ?? null, newValue: nextRole ?? null, action: "update_admin_role", reason: null, createdAt: now });
      if (current.email !== nextEmail) await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "email", oldValue: current.email, newValue: nextEmail, action: "update_admin_email", reason: null, createdAt: now });
      if (current.displayName !== nextDisplayName) await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: id, field: "display_name", oldValue: current.displayName, newValue: nextDisplayName, action: "update_admin_display_name", reason: null, createdAt: now });
      return { id, status: nextStatus, role: nextRole ?? null };
    });
  },

  async listAdminSessions(options: { adminId?: string; status?: "active" | "revoked" | "expired" | "all"; limit?: number } = {}): Promise<AdminSessionSummary[]> {
    const db = getDb();
    const now = new Date();
    const conditions = [];
    if (options.adminId) conditions.push(eq(schema.adminSessions.adminId, options.adminId));
    if (options.status === "revoked") conditions.push(isNotNull(schema.adminSessions.revokedAt));
    if (options.status === "expired") conditions.push(and(isNull(schema.adminSessions.revokedAt), lte(schema.adminSessions.expiresAt, now)));
    if (!options.status || options.status === "active") conditions.push(and(isNull(schema.adminSessions.revokedAt), gt(schema.adminSessions.expiresAt, now)));
    const rows = await db.select({ session: schema.adminSessions, adminName: schema.adminIdentities.displayName }).from(schema.adminSessions).innerJoin(schema.adminIdentities, eq(schema.adminSessions.adminId, schema.adminIdentities.id)).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(schema.adminSessions.lastActivityAt)).limit(Math.min(Math.max(options.limit ?? 100, 1), 100));
    return rows.map(({ session, adminName }) => ({ id: session.id, adminId: session.adminId, adminName, createdAt: asIsoTimestamp(session.createdAt), lastActivityAt: asIsoTimestamp(session.lastActivityAt), expiresAt: asIsoTimestamp(session.expiresAt), status: session.revokedAt ? "revoked" as const : session.expiresAt <= now ? "expired" as const : "active" as const, revokedAt: session.revokedAt ? asIsoTimestamp(session.revokedAt) : null, userAgent: session.userAgent, ipAddress: session.ipAddress }));
  },

  async revokeAdminSession(id: string, actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.update(schema.adminSessions).set({ revokedAt: now }).where(and(eq(schema.adminSessions.id, id), isNull(schema.adminSessions.revokedAt))).returning({ id: schema.adminSessions.id });
      if (!rows[0]) return false;
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_session", entityId: id, field: "revoked_at", oldValue: null, newValue: now.toISOString(), action: "revoke_admin_session", reason: null, createdAt: now });
      return true;
    });
  },

  async revokeAllAdminSessions(adminId: string, actorId: string | null) {
    const db = getDb();
    return db.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.update(schema.adminSessions).set({ revokedAt: now }).where(and(eq(schema.adminSessions.adminId, adminId), isNull(schema.adminSessions.revokedAt))).returning({ id: schema.adminSessions.id });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "admin_identity", entityId: adminId, field: "sessions", oldValue: String(rows.length), newValue: "0", action: "revoke_admin_sessions", reason: null, createdAt: now });
      return rows.length;
    });
  },

  async replaceRecord(id: string, record: PersonRecord, actorId: string | null = null) {
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
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "person", entityId: id, field: "record", oldValue: currentRows[0].slug, newValue: record.person.slug, action: "update_person", reason: null });
    });
    return this.getEditorData(id);
  },

};
