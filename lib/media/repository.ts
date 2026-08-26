import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { MediaAsset, MediaAssetListItem, MediaAssetStatus, MediaExtension, MediaMimeType, MediaUsageType, MediaVisibility } from "@/lib/media/types";

export class MediaSchemaUnavailableError extends Error {
  constructor() { super("Media schema is not available"); this.name = "MediaSchemaUnavailableError"; }
}
export class MediaConflictError extends Error {
  constructor(message = "Media operation conflicts with current usage") { super(message); this.name = "MediaConflictError"; }
}

type AssetInsert = {
  id: string;
  provider: string;
  storageKey: string;
  publicUrl: string;
  originalName: string;
  mimeType: MediaMimeType;
  extension: MediaExtension;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  sourceUrl: string | null;
  attribution: string;
  license: string;
  visibility: MediaVisibility;
  createdBy: string | null;
};

function asIso(value: Date | string) { return value instanceof Date ? value.toISOString() : value; }
function schemaError(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01") throw new MediaSchemaUnavailableError();
  throw error;
}
function assetFromRow(row: typeof schema.mediaAssets.$inferSelect): MediaAsset {
  return { id: row.id, provider: row.provider, storageKey: row.storageKey, publicUrl: row.publicUrl, originalName: row.originalName, mimeType: row.mimeType as MediaMimeType, extension: row.extension as MediaExtension, sizeBytes: row.sizeBytes, width: row.width, height: row.height, altText: row.altText, sourceUrl: row.sourceUrl, attribution: row.attribution, license: row.license, status: row.status as MediaAssetStatus, visibility: row.visibility as MediaVisibility, createdBy: row.createdBy, updatedBy: row.updatedBy, createdAt: asIso(row.createdAt), updatedAt: asIso(row.updatedAt) };
}
function auditValues(actorId: string | null, entityId: string, action: string, oldValue: string | null, newValue: string | null) {
  return { id: randomUUID(), actorType: "admin_identity", actorId, entityType: "media_asset", entityId, field: "record", oldValue, newValue, action, reason: null };
}

export async function listMediaAssets(options: { query?: string; status?: MediaAssetStatus | ""; visibility?: MediaVisibility | ""; limit?: number } = {}): Promise<MediaAssetListItem[]> {
  try {
    const db = getDb();
    const conditions = [];
    const query = options.query?.trim();
    if (query) conditions.push(ilike(schema.mediaAssets.originalName, `%${query}%`));
    if (options.status) conditions.push(eq(schema.mediaAssets.status, options.status));
    if (options.visibility) conditions.push(eq(schema.mediaAssets.visibility, options.visibility));
    const rows = await db.select().from(schema.mediaAssets).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(schema.mediaAssets.createdAt)).limit(Math.min(Math.max(options.limit ?? 100, 1), 100));
    if (rows.length === 0) return [];
    const usageRows = await db.select({ usage: schema.personMedia, person: { id: schema.people.id, nameArabic: schema.people.nameArabic, slug: schema.people.slug } }).from(schema.personMedia).innerJoin(schema.people, eq(schema.personMedia.personId, schema.people.id)).where(inArray(schema.personMedia.mediaAssetId, rows.map((row) => row.id))).orderBy(asc(schema.people.nameArabic));
    const usageMap = new Map<string, MediaAssetListItem["usages"]>();
    for (const row of usageRows) usageMap.set(row.usage.mediaAssetId, [...(usageMap.get(row.usage.mediaAssetId) ?? []), { personId: row.person.id, personNameArabic: row.person.nameArabic, personSlug: row.person.slug, usageType: row.usage.usageType as MediaUsageType, isPrimary: row.usage.isPrimary }]);
    return rows.map((row) => { const asset = assetFromRow(row); const usages = usageMap.get(asset.id) ?? []; return { ...asset, usageCount: usages.length, usages }; });
  } catch (error) { return schemaError(error); }
}

export async function getMediaAsset(id: string) {
  try {
    const rows = await getDb().select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id)).limit(1);
    return rows[0] ? assetFromRow(rows[0]) : null;
  } catch (error) { return schemaError(error); }
}

export async function createMediaAsset(input: AssetInsert) {
  try {
    await getDb().transaction(async (tx) => {
      await tx.insert(schema.mediaAssets).values({ id: input.id, provider: input.provider, storageKey: input.storageKey, publicUrl: input.publicUrl, originalName: input.originalName, mimeType: input.mimeType, extension: input.extension, sizeBytes: input.sizeBytes, width: input.width, height: input.height, altText: input.altText, sourceUrl: input.sourceUrl, attribution: input.attribution, license: input.license, visibility: input.visibility, createdBy: input.createdBy, updatedBy: input.createdBy });
      await tx.insert(schema.auditLogs).values(auditValues(input.createdBy, input.id, "create_media_asset", null, input.publicUrl));
    });
    return getMediaAsset(input.id);
  } catch (error) { return schemaError(error); }
}

export async function createAndAttachMediaAsset(input: AssetInsert & { personId: string; usageType: MediaUsageType; isPrimary: boolean }) {
  try {
    const result = await getDb().transaction(async (tx) => {
      const personRows = await tx.select({ id: schema.people.id }).from(schema.people).where(eq(schema.people.id, input.personId)).limit(1);
      if (!personRows[0]) return null;
      await tx.insert(schema.mediaAssets).values({ id: input.id, provider: input.provider, storageKey: input.storageKey, publicUrl: input.publicUrl, originalName: input.originalName, mimeType: input.mimeType, extension: input.extension, sizeBytes: input.sizeBytes, width: input.width, height: input.height, altText: input.altText, sourceUrl: input.sourceUrl, attribution: input.attribution, license: input.license, visibility: input.visibility, createdBy: input.createdBy, updatedBy: input.createdBy });
      if (input.isPrimary) await tx.update(schema.personMedia).set({ isPrimary: false }).where(and(eq(schema.personMedia.personId, input.personId), eq(schema.personMedia.usageType, input.usageType), eq(schema.personMedia.isPrimary, true)));
      await tx.insert(schema.personMedia).values({ personId: input.personId, mediaAssetId: input.id, usageType: input.usageType, isPrimary: input.isPrimary, createdBy: input.createdBy });
      await tx.insert(schema.auditLogs).values([
        auditValues(input.createdBy, input.id, "create_media_asset", null, input.publicUrl),
        { id: randomUUID(), actorType: "admin_identity", actorId: input.createdBy, entityType: "person_media", entityId: `${input.personId}:${input.id}:${input.usageType}`, field: "attachment", oldValue: null, newValue: input.isPrimary ? "primary" : input.usageType, action: "attach_media_to_person", reason: null },
      ]);
      return input.id;
    });
    return result ? getMediaAsset(result) : null;
  } catch (error) { return schemaError(error); }
}

export async function updateMediaAsset(id: string, input: { altText: string; sourceUrl: string | null; attribution: string; license: string; visibility: MediaVisibility }, actorId: string | null) {
  try {
    const current = await getMediaAsset(id);
    if (!current) return null;
    await getDb().transaction(async (tx) => {
      await tx.update(schema.mediaAssets).set({ altText: input.altText, sourceUrl: input.sourceUrl, attribution: input.attribution, license: input.license, visibility: input.visibility, updatedBy: actorId, updatedAt: new Date() }).where(eq(schema.mediaAssets.id, id));
      await tx.insert(schema.auditLogs).values(auditValues(actorId, id, "update_media_asset", current.visibility, input.visibility));
    });
    return getMediaAsset(id);
  } catch (error) { return schemaError(error); }
}

export async function attachMediaToPerson(personId: string, mediaAssetId: string, usageType: MediaUsageType, isPrimary: boolean, actorId: string | null) {
  try {
    const db = getDb();
    const [personRows, assetRows] = await Promise.all([
      db.select({ id: schema.people.id }).from(schema.people).where(eq(schema.people.id, personId)).limit(1),
      db.select({ id: schema.mediaAssets.id, status: schema.mediaAssets.status }).from(schema.mediaAssets).where(eq(schema.mediaAssets.id, mediaAssetId)).limit(1),
    ]);
    if (!personRows[0] || !assetRows[0]) return null;
    if (assetRows[0].status !== "ready") throw new MediaConflictError("Archived media cannot be attached");
    await db.transaction(async (tx) => {
      if (isPrimary) await tx.update(schema.personMedia).set({ isPrimary: false }).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.usageType, usageType), eq(schema.personMedia.isPrimary, true)));
      const existing = await tx.select({ personId: schema.personMedia.personId }).from(schema.personMedia).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.mediaAssetId, mediaAssetId), eq(schema.personMedia.usageType, usageType))).limit(1);
      if (existing[0]) await tx.update(schema.personMedia).set({ isPrimary }).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.mediaAssetId, mediaAssetId), eq(schema.personMedia.usageType, usageType)));
      else await tx.insert(schema.personMedia).values({ personId, mediaAssetId, usageType, isPrimary, createdBy: actorId });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "person_media", entityId: `${personId}:${mediaAssetId}:${usageType}`, field: "attachment", oldValue: null, newValue: isPrimary ? "primary" : usageType, action: "attach_media_to_person", reason: null });
    });
    return getPersonMedia(personId, false);
  } catch (error) { return schemaError(error); }
}

export async function detachMediaFromPerson(personId: string, mediaAssetId: string, usageType: MediaUsageType, actorId: string | null) {
  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const existing = await tx.select().from(schema.personMedia).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.mediaAssetId, mediaAssetId), eq(schema.personMedia.usageType, usageType))).limit(1);
      if (!existing[0]) return false;
      await tx.delete(schema.personMedia).where(and(eq(schema.personMedia.personId, personId), eq(schema.personMedia.mediaAssetId, mediaAssetId), eq(schema.personMedia.usageType, usageType)));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "person_media", entityId: `${personId}:${mediaAssetId}:${usageType}`, field: "attachment", oldValue: existing[0].isPrimary ? "primary" : usageType, newValue: null, action: "detach_media_from_person", reason: null });
      return true;
    });
    return result;
  } catch (error) { return schemaError(error); }
}

export async function archiveMediaAsset(id: string, actorId: string | null) {
  try {
    const db = getDb();
    const usageRows = await db.select({ personId: schema.personMedia.personId, isPrimary: schema.personMedia.isPrimary }).from(schema.personMedia).where(eq(schema.personMedia.mediaAssetId, id));
    if (usageRows.length > 0) throw new MediaConflictError("Detach media before archiving it");
    const current = await getMediaAsset(id);
    if (!current) return null;
    await db.transaction(async (tx) => {
      await tx.update(schema.mediaAssets).set({ status: "archived", visibility: "private", updatedBy: actorId, updatedAt: new Date() }).where(eq(schema.mediaAssets.id, id));
      await tx.insert(schema.auditLogs).values(auditValues(actorId, id, "archive_media_asset", current.status, "archived"));
    });
    return getMediaAsset(id);
  } catch (error) { return schemaError(error); }
}

export async function getPersonMedia(personId: string, publicOnly: boolean) {
  try {
    const conditions = [eq(schema.personMedia.personId, personId), eq(schema.personMedia.usageType, "portrait" as const), eq(schema.personMedia.isPrimary, true)];
    if (publicOnly) conditions.push(eq(schema.mediaAssets.status, "ready" as const), eq(schema.mediaAssets.visibility, "public" as const));
    const rows = await getDb().select({ asset: schema.mediaAssets, usage: schema.personMedia }).from(schema.personMedia).innerJoin(schema.mediaAssets, eq(schema.personMedia.mediaAssetId, schema.mediaAssets.id)).where(and(...conditions)).limit(1);
    return rows[0] ? assetFromRow(rows[0].asset) : null;
  } catch (error) { return schemaError(error); }
}

export async function countMediaAssets() {
  try {
    const rows = await getDb().select({ count: sql<string>`count(*)` }).from(schema.mediaAssets).where(eq(schema.mediaAssets.status, "ready"));
    return Number(rows[0]?.count ?? 0);
  } catch (error) { return schemaError(error); }
}
