import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseId } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "admins.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    return NextResponse.json({ items: await adminRepository.listAdminSessions(Number.isFinite(limit) ? limit : 100) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const gate = await requirePermissionPrincipal(request, "admins.manage");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const id = parseId(new URL(request.url).searchParams.get("id") ?? "");
    const revoked = await adminRepository.revokeAdminSession(id, gate.principal.id);
    if (!revoked) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
