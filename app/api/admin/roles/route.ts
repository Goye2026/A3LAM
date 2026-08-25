import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { ADMIN_PERMISSIONS, ADMIN_ROLES, permissionsForRole } from "@/lib/admin/rbac";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "roles.read");
  if (gate.response) return gate.response;
  try {
    return NextResponse.json({ roles: ADMIN_ROLES.filter((role) => role !== "USER").map((role) => ({ role, permissions: [...permissionsForRole(role)] })), permissions: [...ADMIN_PERMISSIONS] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
