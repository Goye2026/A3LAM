import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user/auth";
import { createProfileFile, getProfileForUser } from "@/lib/user/profileRepository";
import { putObject, StorageUnavailableError } from "@/lib/storage/provider";
import { InvalidUploadError, validateUpload } from "@/lib/storage/validation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "طلب غير مسموح" }, { status: 403 });
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا" }, { status: 401 });
  const profile = await getProfileForUser(user.id);
  if (!profile) return NextResponse.json({ message: "أنشئ مسودة للملف أولًا" }, { status: 409 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const fileTypeValue = form.get("fileType");
    if (!(file instanceof File)) throw new InvalidUploadError("الملف مطلوب");
    if (fileTypeValue !== "portrait" && fileTypeValue !== "cv" && fileTypeValue !== "document") throw new InvalidUploadError("نوع الملف غير صالح");
    const upload = await validateUpload(file, fileTypeValue);
    const key = `profiles/${user.id}/${profile.profile.id}/${fileTypeValue}-${randomUUID()}.${upload.extension}`;
    const stored = await putObject(key, upload.bytes, upload.mimeType);
    const id = await createProfileFile(profile.profile.id, { storageKey: stored.key, url: stored.url, originalName: upload.originalName, mimeType: upload.mimeType, extension: upload.extension, sizeBytes: upload.sizeBytes, fileType: upload.fileType, isPublic: form.get("isPublic") === "true" });
    return NextResponse.json({ file: { id, url: stored.url, fileType: upload.fileType, isPublic: form.get("isPublic") === "true" } }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidUploadError) return NextResponse.json({ message: error.message }, { status: 400 });
    if (error instanceof StorageUnavailableError) return NextResponse.json({ message: "رفع الملفات غير متاح حاليًا: يلزم إعداد التخزين الخارجي" }, { status: 503 });
    console.error("profile_file_upload_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ message: "تعذر رفع الملف حاليًا" }, { status: 500 });
  }
}
