import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseId } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "sessions.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const statusValue = url.searchParams.get("status") ?? "active";
    const status = ["active", "revoked", "expired", "all"].includes(statusValue) ? statusValue as "active" | "revoked" | "expired" | "all" : "active";
    return NextResponse.json({ items: await adminRepository.listAdminSessions({ limit: Number.isFinite(limit) ? limit : 100, adminId: url.searchParams.get("adminId") ?? undefined, status }) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const gate = await requirePermissionPrincipal(request, "sessions.revoke");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const url = new URL(request.url);
    const idValue = url.searchParams.get("id");
    if (idValue) {
      const revoked = await adminRepository.revokeAdminSession(parseId(idValue), gate.principal.id);
      if (!revoked) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    const adminIdValue = url.searchParams.get("adminId");
    if (adminIdValue) {
      const revoked = await adminRepository.revokeAllAdminSessions(parseId(adminIdValue), gate.principal.id);
      return NextResponse.json({ ok: true, revoked });
    }
    if (url.searchParams.get("current") === "true" && gate.principal.sessionId) {
      const revoked = await adminRepository.revokeAdminSession(gate.principal.sessionId, gate.principal.id);
      return NextResponse.json({ ok: true, revoked });
    }
    return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
