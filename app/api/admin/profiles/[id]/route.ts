import { NextResponse } from "next/server";
import { requireAdminAsync, requirePermissionPrincipal, adminErrorResponse } from "@/lib/admin/http";
import { getAdminProfile, transitionAdminProfile } from "@/lib/user/profileRepository";
import type { ProfileStatus } from "@/lib/domain/a3lam";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = await requirePermissionPrincipal(request, "profiles.read");
  if (unauthorized.response) return unauthorized.response;
  try {
    const { id } = await context.params;
    const profile = await getAdminProfile(id);
    return profile ? NextResponse.json({ profile }) : NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const body = await request.json() as { status?: unknown };
    const permission = body.status === "published" ? "profiles.publish" : "profiles.moderate";
    const gate = await requirePermissionPrincipal(request, permission);
    if (gate.response) return gate.response;
    const status = body.status;
    if (typeof status !== "string" || !["draft", "pending_review", "published", "archived"].includes(status)) return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });
    const { id } = await context.params;
    const profile = await transitionAdminProfile(id, status as ProfileStatus, gate.principal.id);
    return profile ? NextResponse.json({ profile }) : NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.name === "ProfileConflictError") return NextResponse.json({ message: "انتقال الحالة غير مسموح" }, { status: 409 });
    return adminErrorResponse(error);
  }
}
