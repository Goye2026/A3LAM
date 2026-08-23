import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { safeErrors } from "@/lib/errors/taxonomy";

export function requireAdmin(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: safeErrors.UNAUTHORIZED.code, message: safeErrors.UNAUTHORIZED.publicMessage }, { status: safeErrors.UNAUTHORIZED.status });
  }
  return null;
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "AdminInputError") {
    return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  }
  if (error instanceof Error && error.name === "AdminConflictError") {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505") {
    return NextResponse.json({ error: safeErrors.CONFLICT.code, message: safeErrors.CONFLICT.publicMessage }, { status: safeErrors.CONFLICT.status });
  }
  console.error("[Admin] request failed", error);
  return NextResponse.json({ error: safeErrors.INTERNAL_ERROR.code, message: safeErrors.INTERNAL_ERROR.publicMessage }, { status: safeErrors.INTERNAL_ERROR.status });
}

export function adminPageError() {
  return safeErrors.DEPENDENCY_UNAVAILABLE.publicMessage;
}
