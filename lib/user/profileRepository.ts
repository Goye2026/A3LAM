import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { Category, ContentStatus, ProfileStatus, ProfileVisibility, SourceType } from "@/lib/domain/a3lam";
import { normalizeArabic } from "@/lib/domain/search";
import type { ProfileInput } from "@/lib/user/profileValidation";

export type ProfileExperience = { id: string; jobTitle: string; organization: string; location: string; startDate: string | null; endDate: string | null; isCurrent: boolean; description: string };
export type ProfileEducation = { id: string; institution: string; degree: string; field: string; startDate: string | null; endDate: string | null; description: string };
export type ProfileCertification = { id: string; name: string; issuer: string; obtainedDate: string | null; verificationUrl: string | null };
export type ProfileLanguage = { id: string; language: string; proficiency: string };
export type ProfilePortfolioItem = { id: string; title: string; description: string; url: string | null; coverUrl: string | null; workType: string };
export type ProfileSocialLink = { id: string; platform: string; url: string };
export type ProfileFile = { id: string; url: string; originalName: string; mimeType: string; extension: string; sizeBytes: number; fileType: string; isPublic: boolean };

export type Profile = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  nameArabic: string;
  professionalTitle: string;
  professionalSummary: string;
  biography: string;
  city: string | null;
  country: string | null;
  contactEmail: string | null;
  phone: string | null;
  emailPublic: boolean;
  phonePublic: boolean;
  imageUrl: string | null;
  status: ProfileStatus;
  visibility: ProfileVisibility;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRecord = {
  profile: Profile;
  categories: Category[];
  source: ProfileSourceRecord | null;
  skills: string[];
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  certifications: ProfileCertification[];
  languages: ProfileLanguage[];
  portfolio: ProfilePortfolioItem[];
  socialLinks: ProfileSocialLink[];
  files: ProfileFile[];
};

export type PublicProfile = Omit<Profile, "userId" | "contactEmail" | "phone" | "emailPublic" | "phonePublic" | "status" | "visibility"> & {
  email: string | null;
  phone: string | null;
  visibility: ProfileVisibility;
  categories: Category[];
  source: ProfileSourceRecord | null;
  skills: string[];
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  certifications: ProfileCertification[];
  languages: ProfileLanguage[];
  portfolio: ProfilePortfolioItem[];
  socialLinks: ProfileSocialLink[];
  files: ProfileFile[];
};

export type ProfileSourceRecord = { id: string; title: string; publisher: string; url: string; type: SourceType; status: ContentStatus };

export type PublicProfileCard = { slug: string; nameArabic: string; name: string; professionalTitle: string; professionalSummary: string; imageUrl: string | null; city: string | null; country: string | null; skills: string[]; categories: string[] };

type Database = PostgresJsDatabase<typeof schema>;

export { calculateProfileCompletion } from "@/lib/user/profileCompletion";
export type { ProfileCompletion } from "@/lib/user/profileCompletion";

type ProfileRow = typeof schema.profiles.$inferSelect;

function iso(value: Date | string | null) {
  return value instanceof Date ? value.toISOString() : value;
}

function isoDate(value: Date | string | null) {
  return value ? (value instanceof Date ? value.toISOString().slice(0, 10) : value) : null;
}

function category(row: typeof schema.categories.$inferSelect): Category {
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, status: row.status };
}

function profileSource(row: typeof schema.profileSourceRecords.$inferSelect): ProfileSourceRecord {
  return { id: row.id, title: row.title, publisher: row.publisher, url: row.url, type: row.sourceType, status: row.status };
}

async function hydrateProfile(db: Database, row: ProfileRow): Promise<ProfileRecord> {
  const [categoryRows, sourceRows, experienceRows, educationRows, skillRows, certificationRows, languageRows, portfolioRows, socialRows, fileRows] = await Promise.all([
    db.select({ category: schema.categories }).from(schema.profileCategories).innerJoin(schema.categories, eq(schema.profileCategories.categoryId, schema.categories.id)).where(eq(schema.profileCategories.profileId, row.id)),
    db.select().from(schema.profileSourceRecords).where(eq(schema.profileSourceRecords.profileId, row.id)),
    db.select().from(schema.profileExperiences).where(eq(schema.profileExperiences.profileId, row.id)).orderBy(desc(schema.profileExperiences.isCurrent), desc(schema.profileExperiences.startDate)),
    db.select().from(schema.profileEducations).where(eq(schema.profileEducations.profileId, row.id)).orderBy(desc(schema.profileEducations.endDate)),
    db.select().from(schema.profileSkills).where(eq(schema.profileSkills.profileId, row.id)).orderBy(asc(schema.profileSkills.skill)),
    db.select().from(schema.profileCertifications).where(eq(schema.profileCertifications.profileId, row.id)).orderBy(desc(schema.profileCertifications.obtainedDate)),
    db.select().from(schema.profileLanguages).where(eq(schema.profileLanguages.profileId, row.id)).orderBy(asc(schema.profileLanguages.language)),
    db.select().from(schema.profilePortfolioItems).where(eq(schema.profilePortfolioItems.profileId, row.id)).orderBy(asc(schema.profilePortfolioItems.id)),
    db.select().from(schema.profileSocialLinks).where(eq(schema.profileSocialLinks.profileId, row.id)).orderBy(asc(schema.profileSocialLinks.id)),
    db.select().from(schema.profileFiles).where(eq(schema.profileFiles.profileId, row.id)).orderBy(desc(schema.profileFiles.createdAt)),
  ]);
  return {
    profile: {
      id: row.id, userId: row.userId, slug: row.slug, name: row.name, nameArabic: row.nameArabic,
      professionalTitle: row.professionalTitle, professionalSummary: row.professionalSummary, biography: row.biography,
      city: row.city, country: row.country, contactEmail: row.contactEmail, phone: row.phone,
      emailPublic: row.emailPublic, phonePublic: row.phonePublic, imageUrl: row.imageUrl,
      status: row.status, visibility: row.visibility, createdAt: iso(row.createdAt) ?? "", updatedAt: iso(row.updatedAt) ?? "",
    },
    categories: categoryRows.map(({ category: item }) => category(item)),
    source: sourceRows[0] ? profileSource(sourceRows[0]) : null,
    skills: skillRows.map((item) => item.skill),
    experiences: experienceRows.map((item) => ({ id: item.id, jobTitle: item.jobTitle, organization: item.organization, location: item.location, startDate: isoDate(item.startDate), endDate: isoDate(item.endDate), isCurrent: item.isCurrent, description: item.description })),
    educations: educationRows.map((item) => ({ id: item.id, institution: item.institution, degree: item.degree, field: item.field, startDate: isoDate(item.startDate), endDate: isoDate(item.endDate), description: item.description })),
    certifications: certificationRows.map((item) => ({ id: item.id, name: item.name, issuer: item.issuer, obtainedDate: isoDate(item.obtainedDate), verificationUrl: item.verificationUrl })),
    languages: languageRows.map((item) => ({ id: item.id, language: item.language, proficiency: item.proficiency })),
    portfolio: portfolioRows.map((item) => ({ id: item.id, title: item.title, description: item.description, url: item.url, coverUrl: item.coverUrl, workType: item.workType })),
    socialLinks: socialRows.map((item) => ({ id: item.id, platform: item.platform, url: item.url })),
    files: fileRows.map((item) => ({ id: item.id, url: item.url, originalName: item.originalName, mimeType: item.mimeType, extension: item.extension, sizeBytes: item.sizeBytes, fileType: item.fileType, isPublic: item.isPublic })),
  };
}

function publicValid(record: ProfileRecord) {
  return record.profile.status === "published"
    && ["published", "unlisted"].includes(record.profile.visibility)
    && Boolean(record.profile.name.trim() && record.profile.nameArabic.trim() && record.profile.slug && (record.profile.professionalSummary.trim() || record.profile.biography.trim()))
    && record.categories.length > 0
    && record.categories.every((item) => item.status === "published")
    && Boolean(record.source && record.source.status === "published");
}

export function projectPublicProfile(record: ProfileRecord): PublicProfile {
  const { profile } = record;
  return {
    id: profile.id, slug: profile.slug, name: profile.name, nameArabic: profile.nameArabic,
    professionalTitle: profile.professionalTitle, professionalSummary: profile.professionalSummary, biography: profile.biography,
    city: profile.city, country: profile.country, imageUrl: profile.imageUrl,
    createdAt: profile.createdAt, updatedAt: profile.updatedAt,
    visibility: profile.visibility,
    email: profile.emailPublic ? profile.contactEmail : null,
    phone: profile.phonePublic ? profile.phone : null,
    categories: record.categories, source: record.source, skills: record.skills,
    experiences: record.experiences, educations: record.educations, certifications: record.certifications,
    languages: record.languages, portfolio: record.portfolio, socialLinks: record.socialLinks,
    files: record.files.filter((file) => file.isPublic),
  };
}

async function profileById(db: Database, id: string) {
  const rows = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1);
  return rows[0] ? hydrateProfile(db, rows[0]) : null;
}

export async function getProfileForUser(userId: string) {
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
  return rows[0] ? hydrateProfile(db, rows[0]) : null;
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(and(eq(schema.profiles.slug, slug), eq(schema.profiles.status, "published"))).limit(1);
  if (!rows[0]) return null;
  const record = await hydrateProfile(db, rows[0]);
  return publicValid(record) ? projectPublicProfile(record) : null;
}

export async function getUnlistedOrPublishedProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(and(eq(schema.profiles.slug, slug), eq(schema.profiles.status, "published"), inArray(schema.profiles.visibility, ["published", "unlisted"]))).limit(1);
  if (!rows[0]) return null;
  const record = await hydrateProfile(db, rows[0]);
  return publicValid(record) ? projectPublicProfile(record) : null;
}

export async function profileSlugExists(slug: string) {
  const rows = await getDb().select({ slug: schema.profiles.slug }).from(schema.profiles).where(eq(schema.profiles.slug, slug)).limit(1);
  return rows.length > 0;
}

export async function saveUserProfile(userId: string, input: ProfileInput, status: "draft" | "pending_review") {
  const db = getDb();
  const categoryRows = input.categoryIds.length > 0 ? await db.select().from(schema.categories).where(inArray(schema.categories.id, input.categoryIds)) : [];
  if (categoryRows.length !== input.categoryIds.length) throw new Error("Unknown profile category");
  const existing = await getProfileForUser(userId);
  const legacySlugRows = await db.select({ slug: schema.people.slug }).from(schema.people).where(eq(schema.people.slug, input.slug)).limit(1);
  if (legacySlugRows.length > 0) throw new Error("Profile slug is already in use");
  if (!existing && await profileSlugExists(input.slug)) throw new Error("Profile slug is already in use");
  if (existing && existing.profile.slug !== input.slug) throw new Error("Profile slug cannot be changed");
  if (input.source?.id && input.source.id !== existing?.source?.id) throw new Error("Invalid profile source");
  const profileId = existing?.profile.id ?? randomUUID();
  const sourceId = input.source ? (existing?.source?.id || randomUUID()) : null;
  const now = new Date();
  await db.transaction(async (tx) => {
    const profileValues = { id: profileId, userId, slug: input.slug, name: input.name, nameArabic: input.nameArabic, professionalTitle: input.professionalTitle, professionalSummary: input.professionalSummary, biography: input.biography, city: input.city || null, country: input.country || null, contactEmail: input.contactEmail || null, phone: input.phone || null, emailPublic: input.emailPublic, phonePublic: input.phonePublic, imageUrl: input.imageUrl || null, status, visibility: input.visibility, createdAt: existing ? new Date(existing.profile.createdAt) : now, updatedAt: now };
    if (existing) await tx.update(schema.profiles).set(profileValues).where(eq(schema.profiles.id, profileId));
    else await tx.insert(schema.profiles).values(profileValues);
    await tx.delete(schema.profileCategories).where(eq(schema.profileCategories.profileId, profileId));
    await tx.delete(schema.profileSourceRecords).where(eq(schema.profileSourceRecords.profileId, profileId));
    await tx.delete(schema.profileExperiences).where(eq(schema.profileExperiences.profileId, profileId));
    await tx.delete(schema.profileEducations).where(eq(schema.profileEducations.profileId, profileId));
    await tx.delete(schema.profileSkills).where(eq(schema.profileSkills.profileId, profileId));
    await tx.delete(schema.profileCertifications).where(eq(schema.profileCertifications.profileId, profileId));
    await tx.delete(schema.profileLanguages).where(eq(schema.profileLanguages.profileId, profileId));
    await tx.delete(schema.profilePortfolioItems).where(eq(schema.profilePortfolioItems.profileId, profileId));
    await tx.delete(schema.profileSocialLinks).where(eq(schema.profileSocialLinks.profileId, profileId));
    if (input.categoryIds.length > 0) await tx.insert(schema.profileCategories).values(input.categoryIds.map((categoryId) => ({ profileId, categoryId })));
    if (input.source && sourceId) await tx.insert(schema.profileSourceRecords).values({ id: sourceId, profileId, title: input.source.title, publisher: input.source.publisher, url: input.source.url, sourceType: input.source.type, status: "draft", createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: schema.profileSourceRecords.id, set: { title: input.source.title, publisher: input.source.publisher, url: input.source.url, sourceType: input.source.type, status: "draft", updatedAt: now } });
    if (input.skills.length > 0) await tx.insert(schema.profileSkills).values(input.skills.map((skill) => ({ profileId, skill, skillNormalized: normalizeArabic(skill) })));
    if (input.experiences.length > 0) await tx.insert(schema.profileExperiences).values(input.experiences.map((item) => ({ id: randomUUID(), profileId, jobTitle: item.jobTitle, organization: item.organization, location: item.location, startDate: item.startDate || null, endDate: item.endDate || null, isCurrent: item.isCurrent, description: item.description })));
    if (input.educations.length > 0) await tx.insert(schema.profileEducations).values(input.educations.map((item) => ({ id: randomUUID(), profileId, institution: item.institution, degree: item.degree, field: item.field, startDate: item.startDate || null, endDate: item.endDate || null, description: item.description })));
    if (input.certifications.length > 0) await tx.insert(schema.profileCertifications).values(input.certifications.map((item) => ({ id: randomUUID(), profileId, name: item.name, issuer: item.issuer, obtainedDate: item.obtainedDate || null, verificationUrl: item.verificationUrl || null })));
    if (input.languages.length > 0) await tx.insert(schema.profileLanguages).values(input.languages.map((item) => ({ id: randomUUID(), profileId, language: item.language, proficiency: item.proficiency })));
    if (input.portfolio.length > 0) await tx.insert(schema.profilePortfolioItems).values(input.portfolio.map((item, index) => ({ id: `portfolio-${profileId}-${String(index).padStart(3, "0")}`, profileId, title: item.title, description: item.description, url: item.url || null, coverUrl: item.coverUrl || null, workType: item.workType })));
    if (input.socialLinks.length > 0) await tx.insert(schema.profileSocialLinks).values(input.socialLinks.map((item, index) => ({ id: `social-${profileId}-${String(index).padStart(3, "0")}`, profileId, platform: item.platform, url: item.url })));
  });
  return profileById(db, profileId);
}

export async function listPublicProfiles() {
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(and(eq(schema.profiles.status, "published"), eq(schema.profiles.visibility, "published"))).orderBy(asc(schema.profiles.nameArabic));
  const records = await Promise.all(rows.map((row) => hydrateProfile(db, row)));
  return records.filter(publicValid).map((record) => projectPublicProfile(record));
}

export async function searchPublicProfiles(query: string, categoryId?: string, filters: { city?: string; country?: string } = {}) {
  const db = getDb();
  const normalized = normalizeArabic(query);
  const conditions = [eq(schema.profiles.status, "published"), eq(schema.profiles.visibility, "published")];
  if (normalized) {
    const pattern = `%${normalized}%`;
    const skillRows = await db.select({ profileId: schema.profileSkills.profileId }).from(schema.profileSkills).where(ilike(schema.profileSkills.skillNormalized, pattern));
    const skillIds = skillRows.map((item) => item.profileId);
    const textMatch = or(ilike(schema.profiles.name, pattern), ilike(schema.profiles.nameArabic, pattern), ilike(schema.profiles.professionalTitle, pattern), ilike(schema.profiles.professionalSummary, pattern), ilike(schema.profiles.city, pattern), ilike(schema.profiles.country, pattern));
    conditions.push(skillIds.length > 0 ? or(textMatch, inArray(schema.profiles.id, skillIds))! : textMatch!);
  }
  if (filters.city?.trim()) conditions.push(ilike(schema.profiles.city, `%${filters.city.trim()}%`));
  if (filters.country?.trim()) conditions.push(ilike(schema.profiles.country, `%${filters.country.trim()}%`));
  if (categoryId) {
    const relationRows = await db.select({ profileId: schema.profileCategories.profileId }).from(schema.profileCategories).where(eq(schema.profileCategories.categoryId, categoryId));
    const ids = relationRows.map((item) => item.profileId);
    if (ids.length === 0) return [];
    conditions.push(inArray(schema.profiles.id, ids));
  }
  const rows = await db.select().from(schema.profiles).where(and(...conditions)).orderBy(asc(schema.profiles.nameArabic)).limit(100);
  const records = await Promise.all(rows.map((row) => hydrateProfile(db, row)));
  return records.filter(publicValid).map((record) => projectPublicProfile(record));
}

export async function listAdminProfiles(status?: ProfileStatus) {
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(status ? eq(schema.profiles.status, status) : undefined).orderBy(desc(schema.profiles.updatedAt)).limit(100);
  return Promise.all(rows.map((row) => hydrateProfile(db, row)));
}

export async function getAdminProfile(id: string) {
  return profileById(getDb(), id);
}

export async function transitionAdminProfile(id: string, nextStatus: ProfileStatus) {
  const current = await getAdminProfile(id);
  if (!current) return null;
  const allowed: Record<ProfileStatus, ProfileStatus[]> = { draft: ["draft", "pending_review"], pending_review: ["draft", "pending_review", "published"], published: ["published", "archived"], archived: ["archived", "draft"] };
  if (!allowed[current.profile.status].includes(nextStatus)) {
    const error = new Error("This profile status transition is not allowed");
    error.name = "ProfileConflictError";
    throw error;
  }
  if (nextStatus === "published") {
    if (!current.source || current.categories.length === 0 || current.categories.some((item) => item.status !== "published")) throw new Error("Profile publication requirements are not met");
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(schema.profiles).set({ status: nextStatus, updatedAt: new Date() }).where(eq(schema.profiles.id, id));
    if (nextStatus === "published" && current.source) await tx.update(schema.profileSourceRecords).set({ status: "published", updatedAt: new Date() }).where(eq(schema.profileSourceRecords.id, current.source.id));
    await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_session", actorId: null, entityType: "profile", entityId: id, field: "status", oldValue: current.profile.status, newValue: nextStatus, action: "moderate_profile", reason: null });
  });
  return getAdminProfile(id);
}

export async function createProfileFile(profileId: string, input: { storageKey: string; url: string; originalName: string; mimeType: string; extension: string; sizeBytes: number; fileType: string; isPublic: boolean }) {
  const db = getDb();
  const id = randomUUID();
  await db.insert(schema.profileFiles).values({ id, profileId, storageKey: input.storageKey, url: input.url, originalName: input.originalName, mimeType: input.mimeType, extension: input.extension, sizeBytes: input.sizeBytes, fileType: input.fileType, isPublic: input.isPublic });
  return id;
}

export async function getPublicProfileCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = await db.select().from(schema.profiles).where(and(inArray(schema.profiles.id, ids), eq(schema.profiles.status, "published"), eq(schema.profiles.visibility, "published")));
  const records = await Promise.all(rows.map((row) => hydrateProfile(db, row)));
  return records.filter(publicValid).map((record) => ({ slug: record.profile.slug, nameArabic: record.profile.nameArabic, name: record.profile.name, professionalTitle: record.profile.professionalTitle, professionalSummary: record.profile.professionalSummary, imageUrl: record.profile.imageUrl, city: record.profile.city, country: record.profile.country, skills: record.skills.slice(0, 6), categories: record.categories.map((item) => item.name) }));
}

export async function listProfileAuditLogs(profileId: string) {
  const db = getDb();
  return db.select().from(schema.auditLogs).where(and(eq(schema.auditLogs.entityType, "profile"), eq(schema.auditLogs.entityId, profileId))).orderBy(desc(schema.auditLogs.createdAt)).limit(50);
}
