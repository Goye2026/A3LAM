import { NextResponse } from "next/server";
import { reviewAiGenerationClaim } from "@/lib/ai/generation/persistence";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function POST(request: Request, context: { params: Promise<{ claimId: string }> }) {
  const gate = await requirePermissionPrincipal(request, "ai.review");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 64_000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE", message: "The submitted value is too large." }, { status: 413 });

  try {
    const { claimId } = await context.params;
    if (!gate.principal.id) return NextResponse.json({ error: "FORBIDDEN", message: "An identified administrator is required." }, { status: 403 });
    const body = await request.json();
    const result = await reviewAiGenerationClaim(claimId, { ownerType: "ADMIN_IDENTITY", ownerId: gate.principal.id }, gate.principal.id, body);
    if (!result) return NextResponse.json({ error: "NOT_FOUND", message: "The claim was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
