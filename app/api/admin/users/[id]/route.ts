import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseId } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const gate = await requirePermissionPrincipal(request, "users.read");
  if (gate.response) return gate.response;
  try {
    const { id: rawId } = await context.params;
    const item = await adminRepository.getAdminUserDetail(parseId(rawId));
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
