import { unzipSync, type UnzipFileInfo } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import type { ExtractionBoundary } from "../types";
import {
  AI_MAX_DOCX_COMPRESSION_RATIO,
  AI_MAX_DOCX_DECOMPRESSED_BYTES,
  AI_MAX_DOCX_ENTRY_BYTES,
  AI_MAX_DOCX_ENTRY_COUNT,
} from "../validation";
import type { AdapterExtraction } from "./adapter";

export class DocxExtractionError extends Error {
  readonly code: "DOCX_INVALID" | "DOCX_UNSAFE_ARCHIVE" | "PARSER_FAILURE" | "RESOURCE_LIMIT";

  constructor(message: string, code: DocxExtractionError["code"]) {
    super(message);
    this.name = "DocxExtractionError";
    this.code = code;
  }
}

function rejectUnsafeArchiveEntry(file: UnzipFileInfo, totalSize: number, count: number) {
  const normalizedName = file.name.replace(/\\/g, "/");
  if (!normalizedName || normalizedName.startsWith("/") || normalizedName.split("/").includes("..")) throw new DocxExtractionError("مسار داخل DOCX غير آمن", "DOCX_UNSAFE_ARCHIVE");
  if (normalizedName.length > 240 || count > AI_MAX_DOCX_ENTRY_COUNT) throw new DocxExtractionError("عدد أو اسم عناصر DOCX يتجاوز الحد", "RESOURCE_LIMIT");
  if (!Number.isFinite(file.size) || !Number.isFinite(file.originalSize) || file.size < 0 || file.originalSize < 0) throw new DocxExtractionError("بيانات أرشيف DOCX غير صالحة", "DOCX_UNSAFE_ARCHIVE");
  if (file.originalSize > AI_MAX_DOCX_ENTRY_BYTES || totalSize + file.originalSize > AI_MAX_DOCX_DECOMPRESSED_BYTES) throw new DocxExtractionError("حجم فك DOCX يتجاوز الحد", "RESOURCE_LIMIT");
  if (file.size > 0 && file.originalSize / file.size > AI_MAX_DOCX_COMPRESSION_RATIO) throw new DocxExtractionError("نسبة ضغط DOCX مشبوهة", "DOCX_UNSAFE_ARCHIVE");
  if (![0, 8].includes(file.compression)) throw new DocxExtractionError("ضغط DOCX غير مدعوم", "DOCX_UNSAFE_ARCHIVE");
}

type XmlNode = {
  nodeName: string;
  textContent?: string | null;
  childNodes?: { length: number; item(index: number): XmlNode | null };
};

function elementName(node: unknown) {
  return typeof node === "object" && node !== null && "nodeName" in node && typeof node.nodeName === "string" ? node.nodeName : "";
}

function textFromRun(node: XmlNode | null): string {
  if (!node) return "";
  const name = elementName(node);
  if (name === "w:t") return typeof node.textContent === "string" ? node.textContent : "";
  if (name === "w:tab") return "\t";
  if (name === "w:br" || name === "w:cr") return "\n";
  let value = "";
  const children = node?.childNodes;
  for (let index = 0; children && index < children.length; index += 1) value += textFromRun(children.item(index));
  return value;
}

function paragraphsFromBody(body: XmlNode) {
  const paragraphs: string[] = [];
  let tableCells = 0;
  let paragraphCount = 0;
  const visit = (node: XmlNode) => {
    const name = elementName(node);
    if (name === "w:tc") tableCells += 1;
    if (name === "w:p") {
      paragraphCount += 1;
      if (paragraphCount > 5_000) throw new DocxExtractionError("عدد فقرات DOCX يتجاوز الحد", "RESOURCE_LIMIT");
      const text = textFromRun(node).replace(/\n+/g, " ").trim();
      if (text) paragraphs.push(text);
      return;
    }
    const children = node.childNodes;
    for (let index = 0; children && index < children.length; index += 1) {
      const child = children.item(index);
      if (child) visit(child);
    }
  };
  visit(body);
  if (tableCells > 500) throw new DocxExtractionError("عدد خلايا جداول DOCX يتجاوز الحد", "RESOURCE_LIMIT");
  return { paragraphs, tableCells };
}

export function extractDocx(bytes: Uint8Array): AdapterExtraction {
  let totalSize = 0;
  let entryCount = 0;
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(Uint8Array.from(bytes), {
      filter: (file) => {
        entryCount += 1;
        rejectUnsafeArchiveEntry(file, totalSize, entryCount);
        totalSize += file.originalSize;
        return file.name.replace(/\\/g, "/") === "word/document.xml";
      },
    });
  } catch (error) {
    if (error instanceof DocxExtractionError) throw error;
    throw new DocxExtractionError("تعذر فك أرشيف DOCX بأمان", "DOCX_INVALID");
  }

  const documentXml = archive["word/document.xml"];
  if (!documentXml) throw new DocxExtractionError("ملف Word الرئيسي غير موجود", "DOCX_INVALID");
  let xml: string;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(documentXml);
  } catch {
    throw new DocxExtractionError("ترميز XML داخل DOCX غير صالح", "DOCX_INVALID");
  }
  if (/<!DOCTYPE|<!ENTITY/iu.test(xml)) throw new DocxExtractionError("المحتوى النشط أو entities داخل DOCX غير مسموحة", "DOCX_UNSAFE_ARCHIVE");

  try {
    const parser = new DOMParser({ onError: () => undefined });
    const document = parser.parseFromString(xml, "application/xml");
    const body = document.getElementsByTagName("w:body").item(0) as unknown as XmlNode | null;
    if (!body) throw new DocxExtractionError("بنية DOCX غير صالحة", "DOCX_INVALID");
    const { paragraphs } = paragraphsFromBody(body);
    const rawText = paragraphs.join("\n\n").trim();
    if (!rawText) throw new DocxExtractionError("DOCX لا يحتوي نصًا", "DOCX_INVALID");
    const boundaries: ExtractionBoundary[] = [];
    let offset = 0;
    paragraphs.forEach((paragraph, index) => {
      boundaries.push({ kind: "paragraph", index, startOffset: offset, endOffset: offset + paragraph.length });
      offset += paragraph.length + 2;
    });
    return { rawText, pageCount: null, boundaries, warnings: [], parserVersion: "docx-v1-fflate-0.8.3-xmldom-0.9.12", status: "COMPLETED" };
  } catch (error) {
    if (error instanceof DocxExtractionError) throw error;
    throw new DocxExtractionError("تعذر تحليل XML الخاص بـDOCX", "PARSER_FAILURE");
  }
}
