import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermission } from "@/lib/admin/http";
import { parseAdminCategoryInput } from "@/lib/admin/records";
import { adminRepository } from "@/lib/data/adminRepository";

export async function POST(request: Request) {
  const unauthorized = requirePermission(request, "categories.create");
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const input = parseAdminCategoryInput(body, "published");
    const category = await adminRepository.createCategory(input);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
