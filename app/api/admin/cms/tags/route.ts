import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { readBoundedJson } from "@/lib/admin/requestBody";

export async function GET(request: Request) {
  const access = await requirePermissionPrincipal(request, "taxonomy.read");
  if (access.response) return access.response;
  try {
    return NextResponse.json({ items: await editorialRepository.listTags() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const access = await requirePermissionPrincipal(request, "taxonomy.create");
  if (access.response) return access.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const tag = await editorialRepository.createTag(await readBoundedJson(request), access.principal?.id ?? null);
    return NextResponse.json({ ok: true, tag }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
