import { NextResponse } from "next/server";
import { reviewAdminAiFact } from "@/lib/ai/persistence";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function POST(request: Request, context: { params: Promise<{ factId: string }> }) {
  const gate = await requirePermissionPrincipal(request, "ai.review");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  try {
    const { factId } = await context.params;
    const body = await request.json();
    const result = await reviewAdminAiFact(factId, gate.principal.id ?? "", body);
    if (!result) return NextResponse.json({ error: "NOT_FOUND", message: "The fact was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, review: result });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
