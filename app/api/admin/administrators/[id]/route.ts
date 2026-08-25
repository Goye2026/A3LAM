import { NextResponse } from "next/server";
import { getAdminPrincipalFromRequest } from "@/lib/admin/auth";
import { adminErrorResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseAdminIdentityUpdateBody, parseId } from "@/lib/admin/input";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

type Context = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, context: Context) {
  const gate = await requirePermissionPrincipal(request, "admins.read");
  if (gate.response) return gate.response;
  try {
    const { id: rawId } = await context.params;
    const item = await adminRepository.getAdminIdentity(parseId(rawId));
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const current = await adminRepository.getAdminIdentity(id);
    if (!current) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    const input = parseAdminIdentityUpdateBody(await request.json());
    const editorScoped = current.role === "EDITOR" && (!input.role || input.role === "EDITOR");
    const permission = editorScoped ? "editors.manage" : "admins.manage";
    const principal = await getAdminPrincipalFromRequest(request);
    if (!principal || !hasAdminPermission(principal.role, permission)) return NextResponse.json({ error: "FORBIDDEN", message: "You do not have permission to perform this action." }, { status: 403 });
    const item = await adminRepository.updateAdminIdentity(id, input, principal.id);
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
