import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseAdminCategoryInput } from "@/lib/admin/records";
import { adminRepository } from "@/lib/data/adminRepository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function POST(request: Request) {
  const gate = await requirePermissionPrincipal(request, "categories.create");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });

  try {
    const input = parseAdminCategoryInput(await request.json(), "published");
    const category = await adminRepository.createCategory(input, gate.principal.id);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
