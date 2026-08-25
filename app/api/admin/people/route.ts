import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { adminRepository } from "@/lib/data/adminRepository";
import { buildPersonRecord, parseAdminPersonInput } from "@/lib/admin/records";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requirePermissionPrincipal(request, "people.create");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const input = parseAdminPersonInput(await request.json());
    const categories = await adminRepository.listCategoryOptions();
    const record = buildPersonRecord(input, categories);
    await adminRepository.createRecord(record, gate.principal.id);
    return NextResponse.json({ ok: true, person: { id: record.person.id, slug: record.person.slug, status: record.person.status } }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
