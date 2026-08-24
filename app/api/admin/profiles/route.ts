import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/admin/http";
import { listAdminProfiles } from "@/lib/user/profileRepository";
import type { ProfileStatus } from "@/lib/domain/a3lam";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const statusValue = new URL(request.url).searchParams.get("status");
    const status = statusValue && ["draft", "pending_review", "published", "archived"].includes(statusValue) ? statusValue as ProfileStatus : undefined;
    const profiles = await listAdminProfiles(status);
    return NextResponse.json({ profiles });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
