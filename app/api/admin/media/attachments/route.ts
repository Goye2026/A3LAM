import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { detachMediaFromPerson } from "@/lib/media/repository";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { safeErrors } from "@/lib/errors/taxonomy";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const gate = await requirePermissionPrincipal(request, "media.manage");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  try {
    const body = await request.json() as { personId?: unknown; mediaAssetId?: unknown; usageType?: unknown };
    const personId = typeof body.personId === "string" ? body.personId.trim() : "";
    const mediaAssetId = typeof body.mediaAssetId === "string" ? body.mediaAssetId.trim() : "";
    const usageType = body.usageType === "secondary" ? "secondary" : "portrait";
    if (!personId || !mediaAssetId) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
    const detached = await detachMediaFromPerson(personId, mediaAssetId, usageType, gate.principal.id);
    if (!detached) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
