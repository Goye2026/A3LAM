import { NextResponse } from "next/server";
import { getAdminAiDocumentPrivateDetail, listAdminAiFacts } from "@/lib/ai/persistence";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionPrincipal(request, "ai.documents.read");
  if (gate.response) return gate.response;
  try {
    const { id } = await context.params;
    const detail = await getAdminAiDocumentPrivateDetail(id);
    if (!detail) return NextResponse.json({ error: "NOT_FOUND", message: "The document was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...detail, facts: await listAdminAiFacts(id) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
