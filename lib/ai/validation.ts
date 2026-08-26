import { createHash } from "node:crypto";
import { AI_DOCUMENT_TYPES, type AiDocumentType } from "./types";

export const AI_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const AI_EXTRACTED_TEXT_MAX_BYTES = 8 * 1024 * 1024;
export const AI_DOCUMENT_MIME_TYPES: Record<AiDocumentType, readonly string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
};

export class AiDocumentValidationError extends Error {
  constructor(message: string) { super(message); this.name = "AiDocumentValidationError"; }
}

export type ValidatedAiDocument = {
  bytes: Uint8Array;
  documentType: AiDocumentType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
};

function extension(name: string) {
  const match = /\.([a-z0-9]{2,5})$/i.exec(name);
  if (!match) throw new AiDocumentValidationError("امتداد المستند غير صالح");
  return match[1].toLowerCase();
}

function hasPrefix(bytes: Uint8Array, values: number[]) {
  return values.every((value, index) => bytes[index] === value);
}

function containsAscii(bytes: Uint8Array, value: string) {
  return new TextDecoder("latin1").decode(bytes).includes(value);
}

function textPreview(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 2048)).replace(/^\uFEFF/, "").trimStart().toLowerCase();
}

function isHtmlLike(bytes: Uint8Array) {
  const preview = textPreview(bytes);
  return preview.startsWith("<!doctype html") || preview.startsWith("<html") || preview.startsWith("<script") || preview.includes("<script");
}

function detectType(name: string, mimeType: string): AiDocumentType {
  const ext = extension(name);
  const documentType = ext === "pdf" || ext === "docx" || ext === "txt" ? ext : null;
  if (!documentType || !AI_DOCUMENT_TYPES.includes(documentType)) throw new AiDocumentValidationError("نوع المستند غير مدعوم");
  if (!AI_DOCUMENT_MIME_TYPES[documentType].includes(mimeType)) throw new AiDocumentValidationError("MIME المستند لا يطابق امتداده");
  return documentType;
}

function validateSignature(bytes: Uint8Array, documentType: AiDocumentType) {
  if (documentType === "pdf" && (!hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]) || !containsAscii(bytes, "%%EOF"))) throw new AiDocumentValidationError("محتوى PDF غير صالح");
  if (documentType === "docx" && (!hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04]) || !containsAscii(bytes, "[Content_Types].xml") || !containsAscii(bytes, "word/document.xml"))) throw new AiDocumentValidationError("محتوى DOCX غير صالح");
  if (documentType === "txt" && bytes.includes(0)) throw new AiDocumentValidationError("محتوى TXT غير صالح");
  if (documentType === "txt" && isHtmlLike(bytes)) throw new AiDocumentValidationError("لا يسمح بملف HTML متنكر كمستند نصي");
}

export async function validateAiDocument(file: File): Promise<ValidatedAiDocument> {
  if (!file || typeof file.arrayBuffer !== "function") throw new AiDocumentValidationError("المستند مطلوب");
  const originalName = file.name.trim();
  if (!originalName || originalName.length > 180 || /[\u0000-\u001f\\/]/.test(originalName)) throw new AiDocumentValidationError("اسم المستند غير صالح");
  const mimeType = file.type.trim().toLowerCase();
  const documentType = detectType(originalName, mimeType);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > AI_DOCUMENT_MAX_BYTES) throw new AiDocumentValidationError("حجم المستند غير مسموح");
  validateSignature(bytes, documentType);
  return {
    bytes,
    documentType,
    originalName: originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120),
    mimeType,
        sizeBytes: bytes.byteLength,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
export function normalizeExtractedText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n +/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export function assertExtractedText(value: string) {
  const normalized = normalizeExtractedText(value);
  if (!normalized) throw new AiDocumentValidationError("النص المستخرج فارغ");
  if (new TextEncoder().encode(normalized).byteLength > AI_EXTRACTED_TEXT_MAX_BYTES) throw new AiDocumentValidationError("حجم النص المستخرج غير مسموح");
  return normalized;
}
