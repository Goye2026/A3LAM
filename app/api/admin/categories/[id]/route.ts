import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/http";
import { parseAdminCategoryInput } from "@/lib/admin/records";
import { adminRepository } from "@/lib/data/adminRepository";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const id = decodeURIComponent((await context.params).id);
    const current = await adminRepository.getCategory(id);
    if (!current) return NextResponse.json({ error: "NOT_FOUND", message: "The requested record was not found." }, { status: 404 });
    const body = await request.json();
    const input = parseAdminCategoryInput(body, current.status);
    const category = await adminRepository.updateCategory(id, input);
    if (!category) return NextResponse.json({ error: "NOT_FOUND", message: "The requested record was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
