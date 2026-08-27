import { and, asc, desc, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { assertCmsEditorialTransition, type CmsEditorialStatus } from "./editorialStatus";
import { CmsInputError, parseCmsEditorialMutation, parseCmsTagInput } from "./editorialValidation";
import type { CmsEditorialRecord, CmsEditorialRevisionSnapshot, CmsEntityKind, CmsListOptions, CmsListPage, CmsTagInput, CmsTagRecord } from "./editorialTypes";

export class CmsConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsConflictError";
  }
}

type CmsDbExecutor = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "delete">;

function iso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function pageRecord(row: typeof schema.cmsPages.$inferSelect, categoryIds: string[] = []): CmsEditorialRecord {
  return {
    id: row.id,
    kind: "page",
    title: row.title,
    slug: row.slug,
    status: row.status,
    content: row.content,
    excerpt: row.excerpt,
    authorId: row.authorId,
    featuredMediaId: row.featuredMediaId,
    template: row.template,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: iso(row.publishedAt),
    categoryIds,
    tagIds: [],
  };
}

function postRecord(row: typeof schema.cmsPosts.$inferSelect, categoryIds: string[] = [], tagIds: string[] = []): CmsEditorialRecord {
  return {
    id: row.id,
    kind: "post",
    title: row.title,
    slug: row.slug,
    status: row.status,
    content: row.content,
    excerpt: row.excerpt,
    authorId: row.authorId,
    featuredMediaId: row.featuredMediaId,
    template: row.template,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: iso(row.publishedAt),
    categoryIds,
    tagIds,
  };
}

function listBounds(options: CmsListOptions) {
  return {
    page: Math.max(options.page ?? 1, 1),
    pageSize: Math.min(Math.max(options.pageSize ?? 20, 1), 50),
    query: options.query?.trim() ?? "",
    status: options.status ?? "",
  };
}

async function postRelations(db: CmsDbExecutor, postIds: string[]) {
  if (postIds.length === 0) return { categories: new Map<string, string[]>(), tags: new Map<string, string[]>() };
  const [categoryRows, tagRows] = await Promise.all([
    db.select().from(schema.cmsPostCategories).where(inArray(schema.cmsPostCategories.postId, postIds)),
    db.select().from(schema.cmsPostTags).where(inArray(schema.cmsPostTags.postId, postIds)),
  ]);
  const categories = new Map<string, string[]>();
  const tags = new Map<string, string[]>();
  for (const row of categoryRows) categories.set(row.postId, [...(categories.get(row.postId) ?? []), row.categoryId]);
  for (const row of tagRows) tags.set(row.postId, [...(tags.get(row.postId) ?? []), row.tagId]);
  return { categories, tags };
}

function revisionSnapshot(record: CmsEditorialRecord): CmsEditorialRevisionSnapshot {
  return {
    title: record.title,
    slug: record.slug,
    content: record.content,
    excerpt: record.excerpt,
    featuredMediaId: record.featuredMediaId,
    template: record.template,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    canonicalUrl: record.canonicalUrl,
    categoryIds: record.categoryIds,
    tagIds: record.tagIds,
  };
}

async function revision(tx: CmsDbExecutor, record: CmsEditorialRecord, authorId: string | null) {
  await tx.insert(schema.cmsContentRevisions).values({
    id: randomUUID(),
    pageId: record.kind === "page" ? record.id : null,
    postId: record.kind === "post" ? record.id : null,
    version: record.version,
    status: record.status,
    snapshot: revisionSnapshot(record),
    authorId,
  });
}

async function audit(tx: CmsDbExecutor, actorId: string | null, record: CmsEditorialRecord, action: string, field = "record", oldValue: string | null = null, newValue: string | null = null) {
  await tx.insert(schema.auditLogs).values({
    id: randomUUID(),
    actorType: "admin_identity",
    actorId,
    entityType: `cms_${record.kind}`,
    entityId: record.id,
    field,
    oldValue,
    newValue,
    action,
    reason: null,
  });
}

function assertExpectedVersion(current: CmsEditorialRecord, expectedVersion: number | undefined) {
  if (expectedVersion !== undefined && expectedVersion !== current.version) throw new CmsConflictError("The editorial record has changed; reload before saving");
}

async function categoriesExist(db: CmsDbExecutor, categoryIds: string[]) {
  if (categoryIds.length === 0) return;
  const rows = await db.select({ id: schema.categories.id }).from(schema.categories).where(inArray(schema.categories.id, categoryIds));
  if (rows.length !== categoryIds.length) throw new CmsInputError("One or more categories do not exist");
}

async function tagsExist(db: CmsDbExecutor, tagIds: string[]) {
  if (tagIds.length === 0) return;
  const rows = await db.select({ id: schema.cmsTags.id }).from(schema.cmsTags).where(inArray(schema.cmsTags.id, tagIds));
  if (rows.length !== tagIds.length) throw new CmsInputError("One or more tags do not exist");
}

async function getCmsRecord(db: ReturnType<typeof getDb>, kind: CmsEntityKind, id: string): Promise<CmsEditorialRecord | null> {
  if (kind === "page") {
    const rows = await db.select().from(schema.cmsPages).where(eq(schema.cmsPages.id, id)).limit(1);
    return rows[0] ? pageRecord(rows[0]) : null;
  }
  const rows = await db.select().from(schema.cmsPosts).where(eq(schema.cmsPosts.id, id)).limit(1);
  if (!rows[0]) return null;
  const relations = await postRelations(db, [id]);
  return postRecord(rows[0], relations.categories.get(id), relations.tags.get(id));
}

export const editorialRepository = {
  async list(kind: CmsEntityKind, options: CmsListOptions = {}): Promise<CmsListPage> {
    const db = getDb();
    const bounds = listBounds(options);
    const conditions = [];
    if (bounds.query) conditions.push(sql`(${ilike(kind === "page" ? schema.cmsPages.title : schema.cmsPosts.title, `%${bounds.query}%`)} OR ${ilike(kind === "page" ? schema.cmsPages.slug : schema.cmsPosts.slug, `%${bounds.query}%`)})`);
    if (bounds.status) conditions.push(eq(kind === "page" ? schema.cmsPages.status : schema.cmsPosts.status, bounds.status));
    if (options.authorId) conditions.push(eq(kind === "page" ? schema.cmsPages.authorId : schema.cmsPosts.authorId, options.authorId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sort = options.sort === "updated_asc" ? asc(kind === "page" ? schema.cmsPages.updatedAt : schema.cmsPosts.updatedAt) : options.sort === "title" ? asc(kind === "page" ? schema.cmsPages.title : schema.cmsPosts.title) : desc(kind === "page" ? schema.cmsPages.updatedAt : schema.cmsPosts.updatedAt);
    if (kind === "page") {
      const [rows, totalRows] = await Promise.all([
        db.select().from(schema.cmsPages).where(where).orderBy(sort).limit(bounds.pageSize).offset((bounds.page - 1) * bounds.pageSize),
        db.select({ count: sql<string>`count(*)` }).from(schema.cmsPages).where(where),
      ]);
      return { items: rows.map((row) => pageRecord(row)), total: Number(totalRows[0]?.count ?? 0), page: bounds.page, pageSize: bounds.pageSize, query: bounds.query, status: bounds.status };
    }
    const [rows, totalRows] = await Promise.all([
      db.select().from(schema.cmsPosts).where(where).orderBy(sort).limit(bounds.pageSize).offset((bounds.page - 1) * bounds.pageSize),
      db.select({ count: sql<string>`count(*)` }).from(schema.cmsPosts).where(where),
    ]);
    const relations = await postRelations(db, rows.map((row) => row.id));
    return { items: rows.map((row) => postRecord(row, relations.categories.get(row.id), relations.tags.get(row.id))), total: Number(totalRows[0]?.count ?? 0), page: bounds.page, pageSize: bounds.pageSize, query: bounds.query, status: bounds.status };
  },

  async get(kind: CmsEntityKind, id: string) {
    return getCmsRecord(getDb(), kind, id);
  },

  async listPublishedForSitemap(kind: CmsEntityKind) {
    const db = getDb();
    if (kind === "page") {
      const rows = await db.select({ slug: schema.cmsPages.slug, updatedAt: schema.cmsPages.updatedAt }).from(schema.cmsPages).where(and(eq(schema.cmsPages.status, "published"), isNotNull(schema.cmsPages.publishedAt))).orderBy(desc(schema.cmsPages.updatedAt)).limit(10_000);
      return rows;
    }
    return db.select({ slug: schema.cmsPosts.slug, updatedAt: schema.cmsPosts.updatedAt }).from(schema.cmsPosts).where(and(eq(schema.cmsPosts.status, "published"), isNotNull(schema.cmsPosts.publishedAt))).orderBy(desc(schema.cmsPosts.updatedAt)).limit(10_000);
  },

  async getPublishedBySlug(kind: CmsEntityKind, slug: string) {
    const db = getDb();
    if (kind === "page") {
      const rows = await db.select().from(schema.cmsPages).where(and(eq(schema.cmsPages.slug, slug), eq(schema.cmsPages.status, "published"), isNotNull(schema.cmsPages.publishedAt))).limit(1);
      return rows[0] ? pageRecord(rows[0]) : null;
    }
    const rows = await db.select().from(schema.cmsPosts).where(and(eq(schema.cmsPosts.slug, slug), eq(schema.cmsPosts.status, "published"), isNotNull(schema.cmsPosts.publishedAt))).limit(1);
    if (!rows[0]) return null;
    const relations = await postRelations(db, [rows[0].id]);
    return postRecord(rows[0], relations.categories.get(rows[0].id), relations.tags.get(rows[0].id));
  },

  async create(kind: CmsEntityKind, rawInput: unknown, actorId: string | null) {
    const input = parseCmsEditorialMutation(rawInput, kind);
    const db = getDb();
    await categoriesExist(db, input.categoryIds ?? []);
    await tagsExist(db, input.tagIds ?? []);
    const id = randomUUID();
    const now = new Date();
    const status: CmsEditorialStatus = "draft";
    if (kind === "page") {
      await db.transaction(async (tx) => {
        await tx.insert(schema.cmsPages).values({ id, title: input.title, slug: input.slug, status, content: input.content, excerpt: input.excerpt, authorId: actorId, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: 1, createdAt: now, updatedAt: now, publishedAt: null });
        const record = pageRecord({ id, title: input.title, slug: input.slug, status, content: input.content, excerpt: input.excerpt, authorId: actorId, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: 1, createdAt: now, updatedAt: now, publishedAt: null });
        await revision(tx, record, actorId);
        await audit(tx, actorId, record, "create");
      });
      return getCmsRecord(db, kind, id);
    }
    await db.transaction(async (tx) => {
      await tx.insert(schema.cmsPosts).values({ id, title: input.title, slug: input.slug, status, content: input.content, excerpt: input.excerpt, authorId: actorId, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: 1, createdAt: now, updatedAt: now, publishedAt: null });
      for (const categoryId of input.categoryIds ?? []) await tx.insert(schema.cmsPostCategories).values({ postId: id, categoryId });
      for (const tagId of input.tagIds ?? []) await tx.insert(schema.cmsPostTags).values({ postId: id, tagId });
      const record = postRecord({ id, title: input.title, slug: input.slug, status, content: input.content, excerpt: input.excerpt, authorId: actorId, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: 1, createdAt: now, updatedAt: now, publishedAt: null }, input.categoryIds, input.tagIds);
      await revision(tx, record, actorId);
      await audit(tx, actorId, record, "create");
    });
    return getCmsRecord(db, kind, id);
  },

  async update(kind: CmsEntityKind, id: string, rawInput: unknown, actorId: string | null) {
    const input = parseCmsEditorialMutation(rawInput, kind);
    const db = getDb();
    const current = await getCmsRecord(db, kind, id);
    if (!current) return null;
    assertExpectedVersion(current, input.expectedVersion);
    await categoriesExist(db, input.categoryIds ?? []);
    await tagsExist(db, input.tagIds ?? []);
    const nextVersion = current.version + 1;
    const now = new Date();
    await db.transaction(async (tx) => {
      if (kind === "page") {
        const updated = await tx.update(schema.cmsPages).set({ title: input.title, slug: input.slug, content: input.content, excerpt: input.excerpt, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: nextVersion, updatedAt: now }).where(and(eq(schema.cmsPages.id, id), eq(schema.cmsPages.version, current.version))).returning();
        if (updated.length === 0) throw new CmsConflictError("The editorial record has changed; reload before saving");
        const record = pageRecord(updated[0]);
        await revision(tx, record, actorId);
        await audit(tx, actorId, record, "edit", "version", String(current.version), String(nextVersion));
      } else {
        const updated = await tx.update(schema.cmsPosts).set({ title: input.title, slug: input.slug, content: input.content, excerpt: input.excerpt, featuredMediaId: input.featuredMediaId, template: input.template, seoTitle: input.seoTitle, seoDescription: input.seoDescription, canonicalUrl: input.canonicalUrl, version: nextVersion, updatedAt: now }).where(and(eq(schema.cmsPosts.id, id), eq(schema.cmsPosts.version, current.version))).returning();
        if (updated.length === 0) throw new CmsConflictError("The editorial record has changed; reload before saving");
        await tx.delete(schema.cmsPostCategories).where(eq(schema.cmsPostCategories.postId, id));
        await tx.delete(schema.cmsPostTags).where(eq(schema.cmsPostTags.postId, id));
        for (const categoryId of input.categoryIds ?? []) await tx.insert(schema.cmsPostCategories).values({ postId: id, categoryId });
        for (const tagId of input.tagIds ?? []) await tx.insert(schema.cmsPostTags).values({ postId: id, tagId });
        const record = postRecord(updated[0], input.categoryIds, input.tagIds);
        await revision(tx, record, actorId);
        await audit(tx, actorId, record, "edit", "version", String(current.version), String(nextVersion));
      }
    });
    return getCmsRecord(db, kind, id);
  },

  async transition(kind: CmsEntityKind, id: string, next: CmsEditorialStatus, expectedVersion: number, actorId: string | null) {
    const db = getDb();
    const current = await getCmsRecord(db, kind, id);
    if (!current) return null;
    if (current.version !== expectedVersion) throw new CmsConflictError("The editorial record has changed; reload before changing status");
    assertCmsEditorialTransition(current.status, next);
    const now = new Date();
    const publishedAt = next === "published" ? now : next === "draft" || next === "trashed" ? null : current.publishedAt ? new Date(current.publishedAt) : null;
    await db.transaction(async (tx) => {
      if (kind === "page") {
        const updated = await tx.update(schema.cmsPages).set({ status: next, version: current.version + 1, updatedAt: now, publishedAt }).where(and(eq(schema.cmsPages.id, id), eq(schema.cmsPages.version, expectedVersion))).returning();
        if (updated.length === 0) throw new CmsConflictError("The editorial record has changed; reload before changing status");
        const record = pageRecord(updated[0]);
        await revision(tx, record, actorId);
        await audit(tx, actorId, record, "status_transition", "status", current.status, next);
      } else {
        const updated = await tx.update(schema.cmsPosts).set({ status: next, version: current.version + 1, updatedAt: now, publishedAt }).where(and(eq(schema.cmsPosts.id, id), eq(schema.cmsPosts.version, expectedVersion))).returning();
        if (updated.length === 0) throw new CmsConflictError("The editorial record has changed; reload before changing status");
        const relations = await postRelations(tx, [id]);
        const record = postRecord(updated[0], relations.categories.get(id), relations.tags.get(id));
        await revision(tx, record, actorId);
        await audit(tx, actorId, record, "status_transition", "status", current.status, next);
      }
    });
    return getCmsRecord(db, kind, id);
  },

  async listTags(): Promise<CmsTagRecord[]> {
    const rows = await getDb().select().from(schema.cmsTags).orderBy(asc(schema.cmsTags.name)).limit(50);
    return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
  },

  async createTag(rawInput: unknown, actorId: string | null) {
    const input: CmsTagInput = parseCmsTagInput(rawInput);
    const db = getDb();
    const id = randomUUID();
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(schema.cmsTags).values({ id, name: input.name, slug: input.slug, createdAt: now, updatedAt: now });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "cms_tag", entityId: id, field: "record", oldValue: null, newValue: input.slug, action: "create", reason: null });
    });
    return { id, name: input.name, slug: input.slug, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  },
};
