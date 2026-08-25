import { NextResponse } from "next/server";
import { adminErrorResponse, forbiddenResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseAdminIdentityCreateBody } from "@/lib/admin/input";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "admins.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "invited" | "active" | "disabled" | "" | null;
    const role = url.searchParams.get("role") as "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MODERATOR" | "" | null;
    const items = await adminRepository.listAdminIdentities({ query: url.searchParams.get("q") ?? undefined, status: status ?? "", role: role ?? "", limit: 100 });
    return NextResponse.json({ items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    let gate = await requirePermissionPrincipal(request, "admins.manage");
    if (gate.response) {
      gate = await requirePermissionPrincipal(request, "editors.manage");
      if (gate.response) return gate.response;
    }
    const input = parseAdminIdentityCreateBody(await request.json());
    if (gate.principal.role !== "SUPER_ADMIN" && input.role !== "EDITOR") return forbiddenResponse();
    if (input.role === "SUPER_ADMIN" && gate.principal.role !== "SUPER_ADMIN") return forbiddenResponse();
    const item = await adminRepository.createAdminIdentity(input, gate.principal.id);
    return NextResponse.json({ item, activation: "Requires configuration: invitation and credential activation are not enabled in Phase 17.1." }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
