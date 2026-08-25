import { eq } from "drizzle-orm";
import { getAdminPrincipalFromRequest, isAdminRequest } from "@/lib/admin/auth";
import { ADMIN_ROLE_CODES, type AdminPermissionCode, type AdminPrincipal, type AdminRoleCode } from "@/lib/admin/types";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export const ADMIN_ROLES = [...ADMIN_ROLE_CODES, "USER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
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

export function permissionListForRole(role: AdminRoleCode) {
  return [...permissionsForRole(role)];
}

export type PermissionOverride = { permissionCode: AdminPermission; effect: "allow" | "deny" };

export function applyPermissionOverrides(role: AdminRoleCode, overrides: PermissionOverride[]) {
  const effective = new Set<AdminPermission>(permissionsForRole(role));
  for (const override of overrides) {
    if (!allPermissions.has(override.permissionCode)) continue;
    if (override.effect === "allow") effective.add(override.permissionCode);
    else effective.delete(override.permissionCode);
  }
  return effective;
}

export function hasAdminPermission(role: AdminRole | AdminRoleCode | null, permission: AdminPermissionCode) {
  return role !== null && role in rolePermissions && rolePermissions[role as AdminRole].has(permission as AdminPermission);
}

function isMissingPermissionOverrideTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01";
}

export async function effectivePermissionsForPrincipal(principal: AdminPrincipal) {
  if (principal.legacy || !principal.id) return new Set<AdminPermission>(permissionsForRole(principal.role));
  try {
    const rows = await getDb().select({ permissionCode: schema.adminPermissionOverrides.permissionCode, effect: schema.adminPermissionOverrides.effect }).from(schema.adminPermissionOverrides).where(eq(schema.adminPermissionOverrides.adminId, principal.id));
    return applyPermissionOverrides(principal.role, rows.filter((row): row is PermissionOverride => allPermissions.has(row.permissionCode as AdminPermission) && (row.effect === "allow" || row.effect === "deny")) as PermissionOverride[]);
  } catch (error) {
    // Before migration 0005, the missing table is a documented compatibility state.
    if (isMissingPermissionOverrideTable(error)) return new Set<AdminPermission>(permissionsForRole(principal.role));
    throw error;
  }
}

export async function hasEffectiveAdminPermission(principal: AdminPrincipal, permission: AdminPermissionCode) {
  if (!allPermissions.has(permission as AdminPermission)) return false;
  const effective = await effectivePermissionsForPrincipal(principal);
  return effective.has(permission as AdminPermission);
}

export function canAdminRoleManageRole(actor: AdminRole, target: AdminRole) {
  if (actor !== "SUPER_ADMIN") return false;
  return target !== "SUPER_ADMIN";
}

export const SUPER_ADMIN_CORE_PERMISSIONS = ["admins.manage", "permissions.assign", "system.read"] as const;

export function isFinalSuperAdminDeletionAllowed(superAdminCount: number) {
  return superAdminCount > 1;
}

export function canSoleSuperAdminRetainCorePermissions(role: AdminRoleCode, activeSuperAdminCount: number, effectivePermissions: ReadonlySet<AdminPermission>) {
  if (role !== "SUPER_ADMIN" || activeSuperAdminCount > 1) return true;
  return SUPER_ADMIN_CORE_PERMISSIONS.every((permission) => effectivePermissions.has(permission));
}

export async function getAdminPermissionPrincipal(request: Request, permission: AdminPermission): Promise<AdminPrincipal | null> {
  const principal = await getAdminPrincipalFromRequest(request);
  if (!principal || !(await hasEffectiveAdminPermission(principal, permission))) return null;
  return principal;
}

export async function getAdminPrincipalForRequest(request: Request) {
  return getAdminPrincipalFromRequest(request);
}
