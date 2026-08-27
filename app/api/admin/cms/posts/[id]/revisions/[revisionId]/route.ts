import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { assertCmsIdentifier } from "@/lib/cms/editorialValidation";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string; revisionId: string }> };

export async function GET(request: Request, { params }: Props) {
  const gate = await requirePermissionPrincipal(request, "content.read");
  if (gate.response) return gate.response;
  try {
    const { id: rawId, revisionId: rawRevisionId } = await params;
    const id = assertCmsIdentifier(rawId, "id");
    const revisionId = assertCmsIdentifier(rawRevisionId, "revisionId");
    const revision = await editorialRepository.getRevision("post", id, revisionId);
    if (!revision) return NextResponse.json({ error: "NOT_FOUND", message: "Revision not found" }, { status: 404 });
    return NextResponse.json({ revision }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminErrorResponse(error); }
}
