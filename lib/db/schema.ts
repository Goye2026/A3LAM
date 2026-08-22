import { date, index, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ContentStatus, SourceType } from "@/lib/domain/a3lam";

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
};
