import { getAdminPrincipalFromRequest, isAdminRequest } from "@/lib/admin/auth";
import { ADMIN_ROLE_CODES, type AdminPermissionCode, type AdminPrincipal, type AdminRoleCode } from "@/lib/admin/types";

export const ADMIN_ROLES = [...ADMIN_ROLE_CODES, "USER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "users.read",
  "users.manage",
  "users.suspend",
  "users.sessions.revoke",
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
  "appearance.read",
  "appearance.update",
  "media.read",
  "media.manage",
  "seo.read",
  "seo.update",
  "audit.read",
  "settings.read",
  "settings.manage",
  "system.read",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
const allPermissions = new Set<AdminPermission>(ADMIN_PERMISSIONS);
const rolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: allPermissions,
  ADMIN: new Set(ADMIN_PERMISSIONS.filter((permission) => !["admins.manage", "roles.update", "permissions.assign", "settings.manage"].includes(permission))),
  EDITOR: new Set(["people.read", "people.create", "people.update", "people.publish", "profiles.read", "categories.read"]),
  MODERATOR: new Set(["people.read", "profiles.read", "profiles.moderate", "audit.read"]),
  USER: new Set(),
};

export function currentAdminRole(request: Request): AdminRole | null {
  return isAdminRequest(request) ? "SUPER_ADMIN" : null;
}

export function permissionsForRole(role: AdminRole) {
  return rolePermissions[role];
}

export function hasAdminPermission(role: AdminRole | AdminRoleCode | null, permission: AdminPermissionCode) {
  return role !== null && role in rolePermissions && rolePermissions[role as AdminRole].has(permission as AdminPermission);
}

export function canAdminRoleManageRole(actor: AdminRole, target: AdminRole) {
  if (actor !== "SUPER_ADMIN") return false;
  return target !== "SUPER_ADMIN";
}

export function isFinalSuperAdminDeletionAllowed(superAdminCount: number) {
  return superAdminCount > 1;
}

export async function getAdminPermissionPrincipal(request: Request, permission: AdminPermission): Promise<AdminPrincipal | null> {
  const principal = await getAdminPrincipalFromRequest(request);
  if (!principal || !hasAdminPermission(principal.role, permission)) return null;
  return principal;
}

export async function getAdminPrincipalForRequest(request: Request) {
  return getAdminPrincipalFromRequest(request);
}
