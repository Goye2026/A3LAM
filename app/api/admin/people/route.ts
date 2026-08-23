import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/http";
import { adminRepository } from "@/lib/data/adminRepository";
import { buildPersonRecord, parseAdminPersonInput } from "@/lib/admin/records";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const input = parseAdminPersonInput(await request.json());
    const categories = await adminRepository.listCategoryOptions();
    const record = buildPersonRecord(input, categories);
    await adminRepository.createRecord(record);
    return NextResponse.json({ ok: true, person: { id: record.person.id, slug: record.person.slug, status: record.person.status } }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
