import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { archiveMediaAsset, countMediaUsages, getMediaAsset, MediaConflictError, updateMediaAsset } from "@/lib/media/repository";
import { parseMediaMetadataInput } from "@/lib/media/validation";
import { deleteObject, StorageOperationError, StorageUnavailableError } from "@/lib/storage/provider";
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
    const current = await getMediaAsset(id);
    if (!current) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    if (await countMediaUsages(id) > 0) throw new MediaConflictError("Detach media before deleting it");
    await deleteObject(current.storageKey);
    const asset = await archiveMediaAsset(id, gate.principal.id);
    if (!asset) return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    if (error instanceof StorageUnavailableError || error instanceof StorageOperationError) console.warn("Cloudinary media deletion failed", { mediaAssetId: (await params).id, errorType: error.name });
    if (error instanceof StorageUnavailableError || error instanceof StorageOperationError) return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: "تعذر حذف الأصل من Cloudinary." }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
    return adminErrorResponse(error);
  }
}
