import type { Category, ContentStatus, Education, PersonRecord, ProfileStatus, ProfileVisibility, Source, SourceType, TimelineEvent } from "@/lib/domain/a3lam";

export const ADMIN_ROLE_CODES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MODERATOR"] as const;
export type AdminRoleCode = (typeof ADMIN_ROLE_CODES)[number];
export const ADMIN_ACCOUNT_STATUSES = ["invited", "active", "disabled"] as const;
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUSES)[number];
export type AdminPermissionCode = string;

export type AdminIdentitySummary = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRoleCode | null;
  status: AdminAccountStatus;
  lastSignedIn: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  activeSessions: number;
};

export type AdminSessionSummary = {
  id: string;
  adminId: string;
  adminName: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
};

export type AdminPrincipal = {
  id: string | null;
  email: string | null;
  displayName: string;
  role: AdminRoleCode;
  sessionId: string | null;
  legacy: boolean;
};

export type AdminPermissionMatrixRow = {
  role: AdminRoleCode;
  permissions: AdminPermissionCode[];
};

export type AdminUserManagementSummary = AdminUserSummary & {
  email: string;
  accountStatus: "active" | "disabled";
  activeSessions: number;
  profileStatus: ProfileStatus | null;
  visibility: ProfileVisibility | null;
};

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

export type AdminUserSummary = {
  id: string;
  name: string;
  createdAt: string;
  lastSignedIn: string | null;
  profile: { id: string; nameArabic: string; status: string; visibility: string } | null;
};

export type AdminAuditLogItem = {
  id: string;
  actorType: string;
  entityType: string;
  entityId: string;
  field: string;
  action: string;
  createdAt: string;
};

export type AdminCategorySummary = Category & { peopleCount: number; profileCount: number };

export type AdminControlCenterSummary = {
  people: number;
  categories: number;
  users: number;
  profiles: { total: number; pendingReview: number; published: number; draft: number };
  adminIdentities: number | null;
  editors: number | null;
  adminSessions: number | null;
};

export type AdminTimelineRecord = TimelineEvent;
export type AdminEducationRecord = Education;
