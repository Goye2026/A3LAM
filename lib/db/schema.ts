import { boolean, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ContentStatus, ProfileStatus, ProfileVisibility, SourceType } from "@/lib/domain/a3lam";
import type { AdminAccountStatus, AdminPermissionCode, AdminRoleCode } from "@/lib/admin/types";

const lifecycleStatus = (column: string) => text(column).$type<ContentStatus>().notNull().default("draft");

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: lifecycleStatus("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("categories_slug_unique").on(table.slug),
    statusIndex: index("categories_status_idx").on(table.status),
  }),
);

export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameArabic: text("name_arabic").notNull(),
    shortBio: text("short_bio").notNull(),
    biography: text("biography").notNull(),
    birthDate: date("birth_date"),
    deathDate: date("death_date"),
    birthPlace: text("birth_place"),
    deathPlace: text("death_place"),
    imageUrl: text("image_url"),
    status: lifecycleStatus("status"),
    searchName: text("search_name").notNull(),
    searchNameArabic: text("search_name_arabic").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("people_slug_unique").on(table.slug),
    statusIndex: index("people_status_idx").on(table.status),
    searchNameIndex: index("people_search_name_idx").on(table.searchName),
    searchNameArabicIndex: index("people_search_name_arabic_idx").on(table.searchNameArabic),
  }),
);

export const personCategories = pgTable(
  "person_categories",
  {
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.personId, table.categoryId] }),
  }),
);

export const personOccupations = pgTable(
  "person_occupations",
  {
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    occupation: text("occupation").notNull(),
    occupationNormalized: text("occupation_normalized").notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.personId, table.occupation] }),
    normalizedIndex: index("person_occupations_normalized_idx").on(table.occupationNormalized),
  }),
);

export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    publisher: text("publisher").notNull(),
    url: text("url").notNull(),
    publicationDate: date("publication_date"),
    accessedAt: date("accessed_at").notNull(),
    sourceType: text("source_type").$type<SourceType>().notNull(),
    reliability: text("reliability").$type<"high" | "medium" | "low">().notNull(),
    status: lifecycleStatus("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIndex: index("sources_status_idx").on(table.status),
  }),
);

export const personSources = pgTable(
  "person_sources",
  {
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "restrict" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.personId, table.sourceId] }),
  }),
);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: text("id").primaryKey(),
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    personDateIndex: index("timeline_events_person_idx").on(table.personId, table.eventDate),
  }),
);

export const timelineEventSources = pgTable(
  "timeline_event_sources",
  {
    eventId: text("event_id").notNull().references(() => timelineEvents.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "restrict" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.eventId, table.sourceId] }),
  }),
);

export const education = pgTable(
  "education",
  {
    id: text("id").primaryKey(),
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    field: text("field").notNull(),
    dateRange: text("date_range").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    personIndex: index("education_person_idx").on(table.personId),
  }),
);

export const educationSources = pgTable(
  "education_sources",
  {
    educationId: text("education_id").notNull().references(() => education.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "restrict" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.educationId, table.sourceId] }),
  }),
);

export const userAccounts = pgTable(
  "user_accounts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"user" | "admin">().notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignedIn: timestamp("last_signed_in", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => ({
    emailUnique: uniqueIndex("user_accounts_email_unique").on(table.emailNormalized),
  }),
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userAccounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("user_sessions_token_unique").on(table.tokenHash),
    userIndex: index("user_sessions_user_idx").on(table.userId),
    expiryIndex: index("user_sessions_expiry_idx").on(table.expiresAt),
  }),
);

export const adminIdentities = pgTable(
  "admin_identities",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    status: text("status").$type<AdminAccountStatus>().notNull().default("invited"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignedIn: timestamp("last_signed_in", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  },
  (table) => ({
    emailUnique: uniqueIndex("admin_identities_email_unique").on(table.emailNormalized),
    statusIndex: index("admin_identities_status_idx").on(table.status),
  }),
);

export const adminRoles = pgTable("admin_roles", {
  code: text("code").$type<AdminRoleCode>().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const adminPermissions = pgTable("admin_permissions", {
  code: text("code").$type<AdminPermissionCode>().primaryKey(),
  description: text("description").notNull(),
});

export const adminRolePermissions = pgTable(
  "admin_role_permissions",
  {
    roleCode: text("role_code").$type<AdminRoleCode>().notNull().references(() => adminRoles.code, { onDelete: "cascade" }),
    permissionCode: text("permission_code").$type<AdminPermissionCode>().notNull().references(() => adminPermissions.code, { onDelete: "cascade" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.roleCode, table.permissionCode] }),
  }),
);

export const adminRoleAssignments = pgTable(
  "admin_role_assignments",
  {
    adminId: text("admin_id").notNull().references(() => adminIdentities.id, { onDelete: "cascade" }),
    roleCode: text("role_code").$type<AdminRoleCode>().notNull(),
    assignedBy: text("assigned_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.adminId] }),
    roleIndex: index("admin_role_assignments_role_idx").on(table.roleCode),
  }),
);

export const adminPermissionOverrides = pgTable(
  "admin_permission_overrides",
  {
    adminId: text("admin_id").notNull().references(() => adminIdentities.id, { onDelete: "cascade" }),
    permissionCode: text("permission_code").$type<AdminPermissionCode>().notNull(),
    effect: text("effect").$type<"allow" | "deny">().notNull(),
    assignedBy: text("assigned_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.adminId, table.permissionCode] }),
    permissionIndex: index("admin_permission_overrides_permission_idx").on(table.permissionCode),
  }),
);

export const siteExperienceConfigs = pgTable(
  "site_experience_configs",
  {
    resource: text("resource").primaryKey(),
    draft: jsonb("draft").notNull(),
    published: jsonb("published").notNull(),
    updatedBy: text("updated_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedBy: text("published_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    adminId: text("admin_id").notNull().references(() => adminIdentities.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
  },
  (table) => ({
    tokenUnique: uniqueIndex("admin_sessions_token_unique").on(table.tokenHash),
    adminIndex: index("admin_sessions_admin_idx").on(table.adminId),
    expiryIndex: index("admin_sessions_expiry_idx").on(table.expiresAt),
  }),
);

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userAccounts.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameArabic: text("name_arabic").notNull(),
    professionalTitle: text("professional_title").notNull().default(""),
    professionalSummary: text("professional_summary").notNull().default(""),
    biography: text("biography").notNull().default(""),
    city: text("city"),
    country: text("country"),
    contactEmail: text("contact_email"),
    phone: text("phone"),
    emailPublic: boolean("email_public").notNull().default(false),
    phonePublic: boolean("phone_public").notNull().default(false),
    imageUrl: text("image_url"),
    status: text("status").$type<ProfileStatus>().notNull().default("draft"),
    visibility: text("visibility").$type<ProfileVisibility>().notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userUnique: uniqueIndex("profiles_user_unique").on(table.userId),
    slugUnique: uniqueIndex("profiles_slug_unique").on(table.slug),
    statusVisibilityIndex: index("profiles_status_visibility_idx").on(table.status, table.visibility),
  }),
);

export const profileCategories = pgTable(
  "profile_categories",
  {
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.profileId, table.categoryId] }),
  }),
);

export const profileSourceRecords = pgTable(
  "profile_source_records",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    publisher: text("publisher").notNull(),
    url: text("url").notNull(),
    sourceType: text("source_type").$type<SourceType>().notNull(),
    status: lifecycleStatus("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    profileUnique: uniqueIndex("profile_source_records_profile_unique").on(table.profileId),
    profileIndex: index("profile_source_records_profile_idx").on(table.profileId),
  }),
);

export const profileExperiences = pgTable(
  "profile_experiences",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    jobTitle: text("job_title").notNull(),
    organization: text("organization").notNull(),
    location: text("location").notNull().default(""),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isCurrent: boolean("is_current").notNull().default(false),
    description: text("description").notNull().default(""),
  },
  (table) => ({
    profileIndex: index("profile_experiences_profile_idx").on(table.profileId),
  }),
);

export const profileEducations = pgTable(
  "profile_educations",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    degree: text("degree").notNull().default(""),
    field: text("field").notNull().default(""),
    startDate: date("start_date"),
    endDate: date("end_date"),
    description: text("description").notNull().default(""),
  },
  (table) => ({
    profileIndex: index("profile_educations_profile_idx").on(table.profileId),
  }),
);

export const profileSkills = pgTable(
  "profile_skills",
  {
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    skillNormalized: text("skill_normalized").notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.profileId, table.skill] }),
    normalizedIndex: index("profile_skills_normalized_idx").on(table.skillNormalized),
  }),
);

export const profileCertifications = pgTable(
  "profile_certifications",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    issuer: text("issuer").notNull(),
    obtainedDate: date("obtained_date"),
    verificationUrl: text("verification_url"),
  },
  (table) => ({
    profileIndex: index("profile_certifications_profile_idx").on(table.profileId),
  }),
);

export const profileLanguages = pgTable(
  "profile_languages",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    proficiency: text("proficiency").notNull(),
  },
  (table) => ({
    profileIndex: index("profile_languages_profile_idx").on(table.profileId),
  }),
);

export const profilePortfolioItems = pgTable(
  "profile_portfolio_items",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    url: text("url"),
    coverUrl: text("cover_url"),
    workType: text("work_type").notNull(),
  },
  (table) => ({
    profileIndex: index("profile_portfolio_profile_idx").on(table.profileId),
  }),
);

export const profileSocialLinks = pgTable(
  "profile_social_links",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    url: text("url").notNull(),
  },
  (table) => ({
    platformUnique: uniqueIndex("profile_social_platform_unique").on(table.profileId, table.platform),
    profileIndex: index("profile_social_profile_idx").on(table.profileId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    action: text("action").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIndex: index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    actorIndex: index("audit_logs_actor_idx").on(table.actorType, table.actorId, table.createdAt),
  }),
);

export const profileFiles = pgTable(
  "profile_files",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    extension: text("extension").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    fileType: text("file_type").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    storageKeyUnique: uniqueIndex("profile_files_storage_key_unique").on(table.storageKey),
    profileIndex: index("profile_files_profile_idx").on(table.profileId),
  }),
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull().default("external"),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    extension: text("extension").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text").notNull().default(""),
    sourceUrl: text("source_url"),
    attribution: text("attribution").notNull().default(""),
    license: text("license").notNull().default(""),
    status: text("status").$type<"ready" | "archived">().notNull().default("ready"),
    visibility: text("visibility").$type<"private" | "public">().notNull().default("private"),
    createdBy: text("created_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    storageKeyUnique: uniqueIndex("media_assets_storage_key_unique").on(table.storageKey),
    statusVisibilityIndex: index("media_assets_status_visibility_idx").on(table.status, table.visibility),
    createdAtIndex: index("media_assets_created_at_idx").on(table.createdAt),
  }),
);

export const personMedia = pgTable(
  "person_media",
  {
    personId: text("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    mediaAssetId: text("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
    usageType: text("usage_type").$type<"portrait" | "secondary">().notNull().default("portrait"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdBy: text("created_by").references(() => adminIdentities.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.personId, table.mediaAssetId, table.usageType] }),
    assetIndex: index("person_media_asset_idx").on(table.mediaAssetId),
    personIndex: index("person_media_person_idx").on(table.personId),
  }),
);

export const dbSchema = {
  categories,
  people,
  personCategories,
  personOccupations,
  sources,
  personSources,
  timelineEvents,
  timelineEventSources,
  education,
  educationSources,
  userAccounts,
    userSessions,
    adminIdentities,
    adminRoles,
    adminPermissions,
    adminRolePermissions,
    adminRoleAssignments,
    adminPermissionOverrides,
    siteExperienceConfigs,
    adminSessions,
    profiles,
  profileCategories,
  profileSourceRecords,
  profileExperiences,
  profileEducations,
  profileSkills,
  profileCertifications,
  profileLanguages,
  profilePortfolioItems,
  profileSocialLinks,
  profileFiles,
  mediaAssets,
  personMedia,
  auditLogs,
};
