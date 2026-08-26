import { NextResponse } from "next/server";
import { beginAdminAiReview } from "@/lib/ai/persistence";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionPrincipal(request, "ai.review");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const { id } = await context.params;
    const document = await beginAdminAiReview(id, gate.principal.id);
    if (!document) return NextResponse.json({ error: "NOT_FOUND", message: "The document was not found or is not ready for review." }, { status: 404 });
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
