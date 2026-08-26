import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { archiveMediaAsset, getMediaAsset, updateMediaAsset } from "@/lib/media/repository";
import { parseMediaMetadataInput } from "@/lib/media/validation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { safeErrors } from "@/lib/errors/taxonomy";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  const gate = await requirePermissionPrincipal(request, "media.read");
  if (gate.response) return gate.response;
  try {
    const { id } = await params;
    const asset = await getMediaAsset(id);
    if (!asset) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ asset });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const gate = await requirePermissionPrincipal(request, "media.manage");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  try {
    const { id } = await params;
    const asset = await updateMediaAsset(id, parseMediaMetadataInput(await request.json()), gate.principal.id);
    if (!asset) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const gate = await requirePermissionPrincipal(request, "media.manage");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  try {
    const { id } = await params;
    const asset = await archiveMediaAsset(id, gate.principal.id);
    if (!asset) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
