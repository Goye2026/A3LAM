import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { assertCmsIdentifier, parseCmsRevisionRestoreInput } from "@/lib/cms/editorialValidation";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { readBoundedJson } from "@/lib/admin/requestBody";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const gate = await requirePermissionPrincipal(request, "content.read");
  if (gate.response) return gate.response;
  try {
    const { id: rawId } = await params;
    const id = assertCmsIdentifier(rawId, "id");
    return NextResponse.json({ items: await editorialRepository.listRevisions("post", id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request, { params }: Props) {
  const gate = await requirePermissionPrincipal(request, "content.update");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const { id: rawId } = await params;
    const id = assertCmsIdentifier(rawId, "id");
    const input = parseCmsRevisionRestoreInput(await readBoundedJson(request));
    const record = await editorialRepository.restoreRevision("post", id, input.revisionId, input.expectedVersion, gate.principal.id);
    if (!record) return NextResponse.json({ error: "NOT_FOUND", message: "Content not found" }, { status: 404 });
    return NextResponse.json({ ok: true, record });
  } catch (error) { return adminErrorResponse(error); }
}
