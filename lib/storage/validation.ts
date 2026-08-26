const RULES = {
  portrait: { maxBytes: 5 * 1024 * 1024, extensions: ["jpg", "jpeg", "png", "webp"] },
  cv: { maxBytes: 10 * 1024 * 1024, extensions: ["pdf", "jpg", "jpeg", "png", "webp"] },
  document: { maxBytes: 10 * 1024 * 1024, extensions: ["pdf", "jpg", "jpeg", "png", "webp"] },
} as const;

const MIME_BY_EXTENSION: Record<string, string[]> = { pdf: ["application/pdf"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"] };

export class InvalidUploadError extends Error {
  constructor(message: string) { super(message); this.name = "InvalidUploadError"; }
}

export type ImageDimensions = { width: number; height: number };
export type ValidatedUpload = { bytes: Uint8Array; extension: string; mimeType: string; originalName: string; sizeBytes: number; fileType: keyof typeof RULES; dimensions?: ImageDimensions };

function extensionFor(name: string) {
  const last = name.lastIndexOf(".");
  const extension = last >= 0 ? name.slice(last + 1).toLowerCase() : "";
  if (!/^[a-z0-9]{2,5}$/.test(extension)) throw new InvalidUploadError("امتداد الملف غير صالح");
  return extension;
}

function hasBytes(bytes: Uint8Array, values: number[], offset = 0) {
  return values.every((value, index) => bytes[offset + index] === value);
}
function ascii(bytes: Uint8Array, offset: number, length: number) { return String.fromCharCode(...bytes.slice(offset, offset + length)); }
function uint24LE(bytes: Uint8Array, offset: number) { return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16); }

export function readImageDimensions(bytes: Uint8Array, mimeType: string): ImageDimensions | null {
  if (mimeType === "image/png" && hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) && ascii(bytes, 12, 4) === "IHDR" && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (mimeType === "image/webp" && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    const chunk = ascii(bytes, 12, 4);
    if (chunk === "VP8X" && bytes.length >= 30) {
      const width = 1 + uint24LE(bytes, 24);
      const height = 1 + uint24LE(bytes, 27);
      return width > 0 && height > 0 ? { width, height } : null;
    }
    if (chunk === "VP8 " && bytes.length >= 30 && hasBytes(bytes, [0x9d, 0x01, 0x2a], 23)) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const width = view.getUint16(26, true) & 0x3fff;
      const height = view.getUint16(28, true) & 0x3fff;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    return null;
  }
  if (mimeType === "image/jpeg" && hasBytes(bytes, [0xff, 0xd8])) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (offset + 1 >= bytes.length) break;
      const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
      if (isStartOfFrame && segmentLength >= 7) {
        const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
        const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
        return width > 0 && height > 0 ? { width, height } : null;
      }
      offset += segmentLength;
    }
  }
  return null;
}

function hasSignature(bytes: Uint8Array, extension: string) {
  if (extension === "pdf") return hasBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (extension === "jpg" || extension === "jpeg") return hasBytes(bytes, [0xff, 0xd8, 0xff]);
  if (extension === "png") return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "webp") return hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8, 4) === "WEBP";
  return false;
}

export async function validateUpload(file: File, fileType: keyof typeof RULES): Promise<ValidatedUpload> {
  const rule = RULES[fileType];
  if (!rule) throw new InvalidUploadError("نوع الملف غير صالح");
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
  const dimensions = mimeType.startsWith("image/") ? readImageDimensions(bytes, mimeType) : undefined;
  if (mimeType.startsWith("image/") && !dimensions) throw new InvalidUploadError("تعذر قراءة أبعاد الصورة");
  return { bytes, extension, mimeType, originalName: originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120), sizeBytes: bytes.byteLength, fileType, ...(dimensions ? { dimensions } : {}) };
}
