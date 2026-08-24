const RULES = {
  portrait: { maxBytes: 5 * 1024 * 1024, extensions: ["jpg", "jpeg", "png", "webp"] },
  cv: { maxBytes: 10 * 1024 * 1024, extensions: ["pdf", "jpg", "jpeg", "png", "webp"] },
  document: { maxBytes: 10 * 1024 * 1024, extensions: ["pdf", "jpg", "jpeg", "png", "webp"] },
} as const;

const MIME_BY_EXTENSION: Record<string, string[]> = { pdf: ["application/pdf"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"] };

export class InvalidUploadError extends Error {
  constructor(message: string) { super(message); this.name = "InvalidUploadError"; }
}

export type ValidatedUpload = { bytes: Uint8Array; extension: string; mimeType: string; originalName: string; sizeBytes: number; fileType: keyof typeof RULES };

function extensionFor(name: string) {
  const last = name.lastIndexOf(".");
  const extension = last >= 0 ? name.slice(last + 1).toLowerCase() : "";
  if (!/^[a-z0-9]{2,5}$/.test(extension)) throw new InvalidUploadError("امتداد الملف غير صالح");
  return extension;
}

function hasSignature(bytes: Uint8Array, extension: string) {
  const starts = (values: number[]) => values.every((value, index) => bytes[index] === value);
  if (extension === "pdf") return starts([0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (extension === "jpg" || extension === "jpeg") return starts([0xff, 0xd8, 0xff]);
  if (extension === "png") return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "webp") return starts([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}

export async function validateUpload(file: File, fileType: keyof typeof RULES): Promise<ValidatedUpload> {
  const rule = RULES[fileType];
  if (!file || typeof file.arrayBuffer !== "function") throw new InvalidUploadError("الملف مطلوب");
  const originalName = file.name.trim();
  if (!originalName || originalName.length > 180 || /[\u0000-\u001f\\/]/.test(originalName)) throw new InvalidUploadError("اسم الملف غير صالح");
  const extension = extensionFor(originalName);
  if (!rule.extensions.includes(extension as never)) throw new InvalidUploadError("نوع الملف غير مسموح");
  const mimeType = file.type.toLowerCase();
  if (!MIME_BY_EXTENSION[extension]?.includes(mimeType)) throw new InvalidUploadError("نوع الملف لا يطابق امتداده");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > rule.maxBytes) throw new InvalidUploadError("حجم الملف غير مسموح");
  if (!hasSignature(bytes, extension)) throw new InvalidUploadError("محتوى الملف لا يطابق نوعه");
  return { bytes, extension, mimeType, originalName: originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120), sizeBytes: bytes.byteLength, fileType };
}
