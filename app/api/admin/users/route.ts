import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseId } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "users.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
      const statusValue = url.searchParams.get("status") ?? "";
      const profileStatusValue = url.searchParams.get("profileStatus") ?? "";
      const visibilityValue = url.searchParams.get("visibility") ?? "";
      const hasProfileValue = url.searchParams.get("hasProfile") ?? "";
      const disabled = statusValue === "active" || statusValue === "disabled" ? statusValue : "";
      const profileStatus = ["draft", "pending_review", "published", "archived"].includes(profileStatusValue) ? profileStatusValue as "draft" | "pending_review" | "published" | "archived" : "";
      const visibility = ["private", "unlisted", "published"].includes(visibilityValue) ? visibilityValue as "private" | "unlisted" | "published" : "";
      const hasProfile = hasProfileValue === "yes" || hasProfileValue === "no" ? hasProfileValue : "";
      return NextResponse.json({ items: await adminRepository.listAdminUsers({ query: url.searchParams.get("q") ?? undefined, disabled, profileStatus, visibility, hasProfile, limit: 100 }) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const gate = await requirePermissionPrincipal(request, "users.suspend");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || typeof (body as { id?: unknown }).id !== "string" || typeof (body as { disabled?: unknown }).disabled !== "boolean") throw Object.assign(new Error("Invalid user update"), { name: "AdminInputError" });
    const item = await adminRepository.setUserDisabled(parseId((body as { id: string }).id), (body as { disabled: boolean }).disabled, gate.principal.id);
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const gate = await requirePermissionPrincipal(request, "users.sessions.revoke");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const id = parseId(new URL(request.url).searchParams.get("id") ?? "");
    const count = await adminRepository.revokeUserSessions(id, gate.principal.id);
    if (count === null) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, revoked: count });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
