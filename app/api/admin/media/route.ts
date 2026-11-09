import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { listMediaAssets, createAndAttachMediaAsset, createMediaAsset, MediaConflictError, MediaSchemaUnavailableError } from "@/lib/media/repository";
import { parseMediaMetadataInput } from "@/lib/media/validation";
import { getStorageConfigurationIssue, getStorageProviderState, putObject, deleteObject, StorageOperationError, StorageUnavailableError } from "@/lib/storage/provider";
import { InvalidUploadError, validateUpload } from "@/lib/storage/validation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { safeErrors } from "@/lib/errors/taxonomy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "media.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const items = await listMediaAssets({ query: url.searchParams.get("q") ?? "", status: (url.searchParams.get("status") as "ready" | "archived" | "") || "", visibility: (url.searchParams.get("visibility") as "private" | "public" | "") || "" });
    return NextResponse.json({ items, provider: getStorageProviderState() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const gate = await requirePermissionPrincipal(request, "media.manage");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  if (getStorageProviderState() !== "configured") return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: getStorageConfigurationIssue() ?? "رفع الوسائط يتطلب إعداد Cloudinary server-side." }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });

  let uploadedKey: string | null = null;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const personId = typeof form.get("personId") === "string" ? String(form.get("personId")).trim() : "";
    if (!(file instanceof File)) throw new InvalidUploadError("الملف مطلوب");
    const metadata = parseMediaMetadataInput({ altText: form.get("altText"), sourceUrl: form.get("sourceUrl"), attribution: form.get("attribution"), license: form.get("license"), visibility: form.get("visibility") ?? "private" });
    const upload = await validateUpload(file, "portrait");
    const id = randomUUID();
    const key = personId ? `editorial/people/${personId}/portrait-${id}.${upload.extension}` : `editorial/media/${id}.${upload.extension}`;
    const stored = await putObject(key, upload.bytes, upload.mimeType);
    uploadedKey = stored.key;
    const asset = personId
      ? await createAndAttachMediaAsset({ id, personId, usageType: "portrait", isPrimary: true, provider: "external", storageKey: stored.key, publicUrl: stored.url, originalName: upload.originalName, mimeType: upload.mimeType as "image/jpeg" | "image/png" | "image/webp", extension: upload.extension as "jpg" | "jpeg" | "png" | "webp", sizeBytes: upload.sizeBytes, width: upload.dimensions?.width ?? null, height: upload.dimensions?.height ?? null, altText: metadata.altText, sourceUrl: metadata.sourceUrl, attribution: metadata.attribution, license: metadata.license, visibility: metadata.visibility, createdBy: gate.principal.id })
      : await createMediaAsset({ id, provider: "external", storageKey: stored.key, publicUrl: stored.url, originalName: upload.originalName, mimeType: upload.mimeType as "image/jpeg" | "image/png" | "image/webp", extension: upload.extension as "jpg" | "jpeg" | "png" | "webp", sizeBytes: upload.sizeBytes, width: upload.dimensions?.width ?? null, height: upload.dimensions?.height ?? null, altText: metadata.altText, sourceUrl: metadata.sourceUrl, attribution: metadata.attribution, license: metadata.license, visibility: metadata.visibility, createdBy: gate.principal.id });
    if (!asset) {
      await deleteObject(stored.key).catch(() => undefined);
      return NextResponse.json({ error: safeErrors.NOT_FOUND.code, message: safeErrors.NOT_FOUND.publicMessage }, { status: safeErrors.NOT_FOUND.status });
    }
    uploadedKey = null;
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch (error) {
    if (uploadedKey) await deleteObject(uploadedKey).catch(() => undefined);
    if (error instanceof StorageOperationError) {
      console.warn("Cloudinary media upload failed", error.diagnostic);
      return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: error.publicMessage }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
    }
    if (error instanceof StorageUnavailableError) return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: getStorageConfigurationIssue() ?? "تعذر الوصول إلى Cloudinary." }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
    if (error instanceof MediaSchemaUnavailableError) return NextResponse.json({ error: safeErrors.DEPENDENCY_UNAVAILABLE.code, message: "تحتاج بنية Media إلى تطبيق migration 0007 في هذه البيئة." }, { status: safeErrors.DEPENDENCY_UNAVAILABLE.status });
    if (error instanceof InvalidUploadError || error instanceof MediaConflictError) return adminErrorResponse(error);
    return adminErrorResponse(error);
  }
}
