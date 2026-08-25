import { NextResponse } from "next/server";
import { requirePermission, adminErrorResponse } from "@/lib/admin/http";
import { getAdminProfile, transitionAdminProfile } from "@/lib/user/profileRepository";
import type { ProfileStatus } from "@/lib/domain/a3lam";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = requirePermission(request, "profiles.read");
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const profile = await getAdminProfile(id);
    return profile ? NextResponse.json({ profile }) : NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const body = await request.clone().json() as { status?: unknown };
  const permission = body.status === "published" ? "profiles.publish" : "profiles.moderate";
  const unauthorized = requirePermission(request, permission);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const status = body.status;
    if (typeof status !== "string" || !["draft", "pending_review", "published", "archived"].includes(status)) return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });
    const profile = await transitionAdminProfile(id, status as ProfileStatus);
    return profile ? NextResponse.json({ profile }) : NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.name === "ProfileConflictError") return NextResponse.json({ message: "انتقال الحالة غير مسموح" }, { status: 409 });
    return adminErrorResponse(error);
  }
}
