import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { auditLogs, siteExperienceConfigs } from "@/lib/db/schema";
import {
  parseSiteExperienceConfig,
  siteExperienceDefaults,
  type SiteExperienceResource,
} from "@/lib/site-experience/config";

function isMissingTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01";
}

function auditState(resource: SiteExperienceResource, state: "draft" | "published") {
  return JSON.stringify({ resource, state });
}

function parseResource(resource: SiteExperienceResource, value: unknown) {
  return parseSiteExperienceConfig(resource, value);
}

export type AdminSiteExperienceResource<R extends SiteExperienceResource = SiteExperienceResource> = {
  resource: R;
  draft: (typeof siteExperienceDefaults)[R];
  published: (typeof siteExperienceDefaults)[R];
  updatedAt: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
};

export const siteExperienceRepository = {
  async getAdminResource<R extends SiteExperienceResource>(resource: R): Promise<AdminSiteExperienceResource<R>> {
    const db = getDb();
    const rows = await db.select().from(siteExperienceConfigs).where(eq(siteExperienceConfigs.resource, resource)).limit(1);
    const row = rows[0];
    if (!row) {
      return { resource, draft: siteExperienceDefaults[resource], published: siteExperienceDefaults[resource], updatedAt: null, updatedBy: null, publishedAt: null, publishedBy: null };
    }
    return {
      resource,
      draft: parseResource(resource, row.draft) as (typeof siteExperienceDefaults)[R],
      published: parseResource(resource, row.published) as (typeof siteExperienceDefaults)[R],
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      publishedBy: row.publishedBy,
    };
  },

  async saveDraft<R extends SiteExperienceResource>(resource: R, input: unknown, actorId: string | null) {
    const draft = parseResource(resource, input);
    const db = getDb();
    const now = new Date();
    await db.transaction(async (tx) => {
      const existing = await tx.select({ published: siteExperienceConfigs.published }).from(siteExperienceConfigs).where(eq(siteExperienceConfigs.resource, resource)).limit(1);
      const published = existing[0] ? parseResource(resource, existing[0].published) : siteExperienceDefaults[resource];
      await tx.insert(siteExperienceConfigs).values({ resource, draft, published, updatedBy: actorId, updatedAt: now }).onConflictDoUpdate({ target: siteExperienceConfigs.resource, set: { draft, updatedBy: actorId, updatedAt: now } });
      await tx.insert(auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "site_experience", entityId: resource, field: "configuration", oldValue: auditState(resource, "draft"), newValue: auditState(resource, "draft"), action: `${resource.toUpperCase()}_DRAFT_UPDATED`, reason: null, createdAt: now });
    });
    return this.getAdminResource(resource);
  },

  async publish<R extends SiteExperienceResource>(resource: R, actorId: string | null) {
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ draft: siteExperienceConfigs.draft }).from(siteExperienceConfigs).where(eq(siteExperienceConfigs.resource, resource)).limit(1);
      if (!rows[0]) return null;
      const draft = parseResource(resource, rows[0].draft);
      await tx.update(siteExperienceConfigs).set({ published: draft, publishedBy: actorId, publishedAt: now }).where(eq(siteExperienceConfigs.resource, resource));
      await tx.insert(auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId, entityType: "site_experience", entityId: resource, field: "published", oldValue: auditState(resource, "published"), newValue: auditState(resource, "published"), action: `${resource.toUpperCase()}_PUBLISHED`, reason: null, createdAt: now });
      return { resource, publishedAt: now.toISOString(), publishedBy: actorId };
    });
  },

  async getPublishedResource<R extends SiteExperienceResource>(resource: R): Promise<(typeof siteExperienceDefaults)[R]> {
    try {
      const db = getDb();
      const rows = await db.select({ published: siteExperienceConfigs.published }).from(siteExperienceConfigs).where(eq(siteExperienceConfigs.resource, resource)).limit(1);
      if (!rows[0]) return siteExperienceDefaults[resource];
      return parseResource(resource, rows[0].published) as (typeof siteExperienceDefaults)[R];
    } catch (error) {
      if (isMissingTable(error)) return siteExperienceDefaults[resource];
      return siteExperienceDefaults[resource];
    }
  },

  async getPublicSnapshot() {
    const resources = await Promise.all((Object.keys(siteExperienceDefaults) as SiteExperienceResource[]).map(async (resource) => [resource, await this.getPublishedResource(resource)] as const));
    return Object.fromEntries(resources) as typeof siteExperienceDefaults;
  },
};
