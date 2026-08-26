import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { parseAdminStatus, buildPersonRecord, parseAdminPersonInput } from "@/lib/admin/records";
import { adminRepository } from "@/lib/data/adminRepository";
import { safeErrors } from "@/lib/errors/taxonomy";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  try {
    const body = await request.json() as { status?: unknown };
    const permission = body.status === "published" ? "people.publish" : "people.update";
    const gate = await requirePermissionPrincipal(request, permission);
    if (gate.response) return gate.response;
    const { id } = await params;
    const updated = await adminRepository.transitionStatus(id, parseAdminStatus(body.status), gate.principal.id);
    if (!updated) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, person: { id, slug: updated.record.person.slug, status: updated.record.person.status } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  const gate = await requirePermissionPrincipal(request, "people.update");
  if (gate.response) return gate.response;
  try {
    const { id } = await params;
    const existing = await adminRepository.getEditorData(id);
    if (!existing) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    const input = parseAdminPersonInput(await request.json());
    const record = buildPersonRecord(input, existing.categories, existing.record);
    const updated = await adminRepository.replaceRecord(id, record, gate.principal.id);
    if (!updated) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, person: { id: record.person.id, slug: record.person.slug, status: record.person.status } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
