import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { readBoundedJson } from "@/lib/admin/requestBody";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requirePermissionPrincipal(request, "content.read");
  if (access.response) return access.response;
  try {
    const { id } = await context.params;
    const record = await editorialRepository.get("post", id);
    if (!record) return NextResponse.json({ error: "NOT_FOUND", message: "Content not found" }, { status: 404 });
    return NextResponse.json({ record }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requirePermissionPrincipal(request, "content.update");
  if (access.response) return access.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const { id } = await context.params;
    const record = await editorialRepository.update("post", id, await readBoundedJson(request), access.principal?.id ?? null);
    if (!record) return NextResponse.json({ error: "NOT_FOUND", message: "Content not found" }, { status: 404 });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
