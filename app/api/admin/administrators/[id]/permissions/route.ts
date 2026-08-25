import { NextResponse } from "next/server";
import { adminErrorResponse, forbiddenResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseId, parsePermissionOverridesBody } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const gate = await requirePermissionPrincipal(request, "permissions.read");
  if (gate.response) return gate.response;
  try {
    const { id: rawId } = await context.params;
    const item = await adminRepository.getAdminEffectivePermissions(parseId(rawId));
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  const gate = await requirePermissionPrincipal(request, "permissions.assign");
  if (gate.response) return gate.response;
  if (!gate.principal || gate.principal.role !== "SUPER_ADMIN") return forbiddenResponse();
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const input = parsePermissionOverridesBody(await request.json());
    const item = await adminRepository.replaceAdminPermissionOverrides(id, input.overrides, gate.principal.id);
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
