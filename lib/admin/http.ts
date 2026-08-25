import { NextResponse } from "next/server";
import { getAdminPrincipalFromRequest, isAdminRequest } from "@/lib/admin/auth";
import { safeErrors } from "@/lib/errors/taxonomy";
import { hasAdminPermission, type AdminPermission } from "@/lib/admin/rbac";

function unauthorizedResponse() {
  return NextResponse.json({ error: safeErrors.UNAUTHORIZED.code, message: safeErrors.UNAUTHORIZED.publicMessage }, { status: safeErrors.UNAUTHORIZED.status });
}

function forbiddenResponse() {
  return NextResponse.json({ error: safeErrors.FORBIDDEN.code, message: safeErrors.FORBIDDEN.publicMessage }, { status: safeErrors.FORBIDDEN.status });
}

export function requireAdmin(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  return null;
}

export async function requireAdminAsync(request: Request) {
  if (!(await getAdminPrincipalFromRequest(request))) return unauthorizedResponse();
  return null;
}

export async function requirePermission(request: Request, permission: AdminPermission) {
  const principal = await getAdminPrincipalFromRequest(request);
  if (!principal) return unauthorizedResponse();
  if (!hasAdminPermission(principal.role, permission)) return forbiddenResponse();
  return null;
}

export async function requirePermissionPrincipal(request: Request, permission: AdminPermission) {
  const principal = await getAdminPrincipalFromRequest(request);
  if (!principal) return { response: unauthorizedResponse(), principal: null };
  if (!hasAdminPermission(principal.role, permission)) return { response: forbiddenResponse(), principal: null };
  return { response: null, principal };
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof Error && (error.name === "AdminInputError" || error.name === "AdminValidationError")) {
    return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  }
  if (error instanceof Error && error.name === "AdminConflictError") {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505") {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  console.error("[Admin] request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: safeErrors.INTERNAL_ERROR.code, message: safeErrors.INTERNAL_ERROR.publicMessage }, { status: safeErrors.INTERNAL_ERROR.status });
}

export function adminPageError() {
  return safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage;
}

export { forbiddenResponse, unauthorizedResponse };
