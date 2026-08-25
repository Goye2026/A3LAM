import type { Category, ContentStatus, Education, PersonRecord, ProfileStatus, ProfileVisibility, Source, SourceType, TimelineEvent } from "@/lib/domain/a3lam";

export const ADMIN_ROLE_CODES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MODERATOR"] as const;
export type AdminRoleCode = (typeof ADMIN_ROLE_CODES)[number];
export const ADMIN_ACCOUNT_STATUSES = ["invited", "active", "disabled"] as const;
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUSES)[number];
export const ADMIN_PERMISSION_CODES = [
  "users.read",
  "users.manage",
  "users.suspend",
  "users.sessions.revoke",
  "sessions.read",
  "sessions.revoke",
  "admins.read",
  "admins.manage",
  "editors.read",
  "editors.manage",
  "roles.read",
  "roles.update",
  "permissions.read",
  "permissions.assign",
  "people.read",
  "people.create",
  "people.update",
  "people.delete",
  "people.publish",
  "profiles.read",
  "profiles.moderate",
  "profiles.publish",
  "profiles.unpublish",
  "categories.read",
  "categories.create",
  "categories.update",
  "categories.delete",
  "homepage.read",
  "homepage.update",
  "homepage.publish",
  "appearance.read",
  "appearance.update",
  "navigation.read",
  "navigation.update",
  "footer.read",
  "footer.update",
  "profile_presentation.read",
  "profile_presentation.update",
  "media.read",
  "media.manage",
  "seo.read",
  "seo.update",
  "audit.read",
  "settings.read",
  "settings.manage",
  "system.read",
  "system.migrations.execute",
] as const;
export type AdminPermissionCode = (typeof ADMIN_PERMISSION_CODES)[number];

export type AdminIdentitySummary = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRoleCode | null;
  status: AdminAccountStatus;
  lastSignedIn: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
};

export type AdminSessionSummary = {
  id: string;
  adminId: string;
  adminName: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
  revokedAt: string | null;
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

export type AdminPermissionOverrideSummary = {
  permissionCode: AdminPermissionCode;
  effect: "allow" | "deny";
  assignedBy: string | null;
  assignedAt: string;
};

export type AdminEffectivePermissions = {
  adminId: string;
  role: AdminRoleCode | null;
  defaults: AdminPermissionCode[];
  overrides: AdminPermissionOverrideSummary[];
  effective: AdminPermissionCode[];
};

export type AdminUserManagementPage = {
  items: AdminUserManagementSummary[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  sort: "created_desc" | "created_asc" | "name" | "last_signed_in_desc";
};

export type AdminUserManagementSummary = AdminUserSummary & {
  email: string;
  accountStatus: "active" | "disabled";
  activeSessions: number;
  completionPercent: number | null;
  profileStatus: ProfileStatus | null;
  visibility: ProfileVisibility | null;
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  accountStatus: "active" | "disabled";
  createdAt: string;
  lastSignedIn: string | null;
  profile: {
    id: string;
    slug: string;
    name: string;
    nameArabic: string;
    status: string;
    visibility: string;
    completion: { percent: number; completed: string[]; remaining: string[] };
  } | null;
  sessions: { id: string; createdAt: string; expiresAt: string }[];
  audit: AdminAuditLogItem[];
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
  actorId: string | null;
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
  activeUsers: number;
  profiles: { total: number; pendingReview: number; published: number; draft: number };
  adminIdentities: number | null;
  editors: number | null;
  adminSessions: number | null;
  recentAudit: AdminAuditLogItem[];
};

export type AdminTimelineRecord = TimelineEvent;
export type AdminEducationRecord = Education;
