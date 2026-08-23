import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/http";
import { parseAdminStatus, buildPersonRecord, parseAdminPersonInput } from "@/lib/admin/records";
import { adminRepository } from "@/lib/data/adminRepository";
import { safeErrors } from "@/lib/errors/taxonomy";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json() as { status?: unknown };
    const updated = await adminRepository.transitionStatus(id, parseAdminStatus(body.status));
    if (!updated) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, person: { id, slug: updated.record.person.slug, status: updated.record.person.status } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await adminRepository.getEditorData(id);
    if (!existing) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    const input = parseAdminPersonInput(await request.json());
    const record = buildPersonRecord(input, existing.categories, existing.record);
    const updated = await adminRepository.replaceRecord(id, record);
    if (!updated) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, person: { id: record.person.id, slug: record.person.slug, status: record.person.status } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
