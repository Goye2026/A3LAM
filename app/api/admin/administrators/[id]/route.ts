import { NextResponse } from "next/server";
import { adminErrorResponse, forbiddenResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseAdminIdentityUpdateBody, parseId } from "@/lib/admin/input";
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
    let gate = await requirePermissionPrincipal(request, "admins.manage");
    const hasAdminManagement = !gate.response;
    if (gate.response) {
      gate = await requirePermissionPrincipal(request, "editors.manage");
      if (gate.response) return gate.response;
    }
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const current = await adminRepository.getAdminIdentity(id);
    if (!current) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    const input = parseAdminIdentityUpdateBody(await request.json());
    if ((!hasAdminManagement && current.role !== "EDITOR") || (!hasAdminManagement && input.role && input.role !== "EDITOR")) return forbiddenResponse();
    const principal = gate.principal;
    if (!principal) return forbiddenResponse();
    if ((current.role === "SUPER_ADMIN" || input.role === "SUPER_ADMIN") && principal.role !== "SUPER_ADMIN") return forbiddenResponse();
    const item = await adminRepository.updateAdminIdentity(id, input, principal.id);
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
