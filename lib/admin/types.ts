import type { Category, ContentStatus, Education, PersonRecord, Source, SourceType, TimelineEvent } from "@/lib/domain/a3lam";

export type AdminSourceInput = {
  id?: string;
  title: string;
  publisher: string;
  url: string;
  publicationDate: string;
  accessedAt: string;
  type: SourceType;
  reliability: Source["reliability"];
};

export type AdminTimelineInput = {
  id?: string;
  date: string;
  title: string;
  description: string;
  sourceIds: string[];
};

export type AdminEducationInput = {
  id?: string;
  institution: string;
  field: string;
  dateRange: string;
  description: string;
  sourceIds: string[];
};

export type AdminCategoryInput = {
  name: string;
  description: string;
  slug: string;
  status: ContentStatus;
};

export type AdminPersonInput = {
  name: string;
  nameArabic: string;
  slug: string;
  shortBio: string;
  biography: string;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  deathPlace: string;
  image: string;
  status: ContentStatus;
  categoryIds: string[];
  occupations: string[];
  sources: AdminSourceInput[];
  timeline: AdminTimelineInput[];
  education: AdminEducationInput[];
};

export type AdminPersonListItem = {
  id: string;
  slug: string;
  nameArabic: string;
  name: string;
  status: ContentStatus;
  categories: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardData = {
  counts: Record<ContentStatus, number>;
  recent: AdminPersonListItem[];
};

export type AdminPeoplePage = {
  items: AdminPersonListItem[];
  total: number;
  page: number;
  pageSize: number;
  status: ContentStatus | "";
  query: string;
};

export type AdminPersonEditorData = {
  record: PersonRecord;
  categories: Category[];
};

export type AdminTimelineRecord = TimelineEvent;
export type AdminEducationRecord = Education;
