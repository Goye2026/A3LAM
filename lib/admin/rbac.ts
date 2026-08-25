import { isAdminRequest } from "@/lib/admin/auth";

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MODERATOR", "USER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "users.read",
  "users.manage",
  "users.suspend",
  "admins.read",
  "admins.manage",
  "editors.read",
  "editors.manage",
  "people.read",
  "people.create",
  "people.update",
  "people.publish",
  "profiles.read",
  "profiles.moderate",
  "profiles.publish",
  "categories.read",
  "categories.create",
  "categories.update",
  "homepage.read",
  "homepage.update",
  "appearance.read",
  "appearance.update",
  "media.read",
  "media.manage",
  "seo.read",
  "seo.update",
  "audit.read",
  "system.read",
  "settings.manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const allPermissions = new Set<AdminPermission>(ADMIN_PERMISSIONS);

const rolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: allPermissions,
  ADMIN: new Set(ADMIN_PERMISSIONS.filter((permission) => permission !== "admins.manage" && permission !== "settings.manage")),
  EDITOR: new Set(["people.read", "people.create", "people.update", "profiles.read", "categories.read"]),
  MODERATOR: new Set(["people.read", "profiles.read", "profiles.moderate", "audit.read"]),
  USER: new Set(),
};

/**
 * The existing single Admin access token has no persisted identity or role.
 * Until an explicitly designed Admin identity migration exists, it is the
 * only principal that may receive the temporary SUPER_ADMIN policy.
 */
export function currentAdminRole(request: Request): AdminRole | null {
  return isAdminRequest(request) ? "SUPER_ADMIN" : null;
}

export function permissionsForRole(role: AdminRole) {
  return rolePermissions[role];
}

export function hasAdminPermission(role: AdminRole | null, permission: AdminPermission) {
  return role !== null && rolePermissions[role].has(permission);
}

export function canAdminRoleManageRole(actor: AdminRole, target: AdminRole) {
  if (actor !== "SUPER_ADMIN") return false;
  return target !== "SUPER_ADMIN";
}

export function isFinalSuperAdminDeletionAllowed(superAdminCount: number) {
  return superAdminCount > 1;
}

export function requireAdminPermission(request: Request, permission: AdminPermission) {
  const role = currentAdminRole(request);
  if (!hasAdminPermission(role, permission)) return null;
  return { role, permission } as const;
}
