import { NextResponse } from "next/server";
import { getAdminPrincipalFromRequest, isAdminRequest } from "@/lib/admin/auth";
import { MediaSchemaUnavailableError, MediaConflictError } from "@/lib/media/repository";
import { MediaInputError } from "@/lib/media/validation";
import { safeErrors } from "@/lib/errors/taxonomy";
import { hasEffectiveAdminPermission, type AdminPermission } from "@/lib/admin/rbac";

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
  try {
    if (!(await hasEffectiveAdminPermission(principal, permission))) return forbiddenResponse();
    return null;
  } catch {
    return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
  }
}

export async function requirePermissionPrincipal(request: Request, permission: AdminPermission) {
  const principal = await getAdminPrincipalFromRequest(request);
  if (!principal) return { response: unauthorizedResponse(), principal: null };
  try {
    if (!(await hasEffectiveAdminPermission(principal, permission))) return { response: forbiddenResponse(), principal: null };
    return { response: null, principal };
  } catch {
    return { response: NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status }), principal: null };
  }
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof Error && (error.name === "AdminInputError" || error.name === "AdminValidationError" || error.name === "AiDocumentValidationError" || error.name === "AiFactValidationError" || error instanceof MediaInputError)) {
    return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  }
  if (error instanceof Error && ["AdminConflictError", "AiDocumentConflictError", "MigrationRegistryInconsistentError", "MigrationAlreadyAppliedError", "MigrationPrerequisiteError", "MigrationStateChangedError"].includes(error.name)) {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  if (error instanceof MediaConflictError) {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  if (error instanceof Error && ["AiPersistenceUnavailableError", "AiQueueUnavailableError", "DocumentStorageUnavailableError"].includes(error.name)) {
    return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
  }
  if (error instanceof MediaSchemaUnavailableError) {
    return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
  }
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505") {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01") {
    return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
  }
  console.error("[Admin] request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: safeErrors.INTERNAL_ERROR.code, message: safeErrors.INTERNAL_ERROR.publicMessage }, { status: safeErrors.INTERNAL_ERROR.status });
}

export function adminPageError() {
  return safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage;
}

export { forbiddenResponse, unauthorizedResponse };
