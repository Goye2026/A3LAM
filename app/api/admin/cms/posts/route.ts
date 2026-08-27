import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { readBoundedJson } from "@/lib/admin/requestBody";

function listOptions(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const query = url.searchParams.get("q")?.slice(0, 120) ?? "";
  const status = url.searchParams.get("status") ?? "";
  const sort = url.searchParams.get("sort") ?? "updated_desc";
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 50) : 20,
    query,
    status: ["", "draft", "review", "scheduled", "published", "trashed"].includes(status) ? status as "" | "draft" | "review" | "scheduled" | "published" | "trashed" : "",
    sort: ["updated_desc", "updated_asc", "title"].includes(sort) ? sort as "updated_desc" | "updated_asc" | "title" : "updated_desc",
  };
}

export async function GET(request: Request) {
  const access = await requirePermissionPrincipal(request, "content.read");
  if (access.response) return access.response;
  try {
    return NextResponse.json(await editorialRepository.list("post", listOptions(request)), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const access = await requirePermissionPrincipal(request, "content.create");
  if (access.response) return access.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const record = await editorialRepository.create("post", await readBoundedJson(request), access.principal?.id ?? null);
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
