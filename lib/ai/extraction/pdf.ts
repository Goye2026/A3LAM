import { unzlibSync } from "fflate";
import type { ExtractionBoundary, ExtractionWarning } from "../types";
import { AI_EXTRACTED_TEXT_MAX_BYTES, AI_MAX_PDF_PAGES } from "../validation";
import type { AdapterExtraction } from "./adapter";

const MAX_PDF_STREAM_BYTES = AI_EXTRACTED_TEXT_MAX_BYTES;

export class PdfExtractionError extends Error {
  readonly code: "PDF_TEXT_UNAVAILABLE" | "OCR_REQUIRED" | "PARSER_FAILURE" | "RESOURCE_LIMIT";

  constructor(message: string, code: PdfExtractionError["code"]) {
    super(message);
    this.name = "PdfExtractionError";
    this.code = code;
  }
}

function latin1Bytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

function decodePdfLiteral(value: string) {
  return value.replace(/\\([\\()nrtbf])/g, (_, escaped: string) => ({ "\\": "\\", "(": "(", ")": ")", n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[escaped] ?? escaped)).replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function extractTextOperators(stream: string) {
  const text: string[] = [];
  const literalPattern = /\(((?:\\.|[^\\()])*)\)\s*Tj/gu;
  for (const match of stream.matchAll(literalPattern)) text.push(decodePdfLiteral(match[1]));
  const arrayPattern = /\[((?:\((?:\\.|[^\\()])*\)|\s|[-+\d.])+)\]\s*TJ/gu;
  for (const match of stream.matchAll(arrayPattern)) {
    for (const literal of match[1].matchAll(/\(((?:\\.|[^\\()])*)\)/gu)) text.push(decodePdfLiteral(literal[1]));
  }
  return text.join(" ").replace(/[ \t]+/g, " ").trim();
}

function ascii85Bytes(value: string) {
  const input = value.replace(/<~|~>/g, "").replace(/\s+/gu, "");
  const output: number[] = [];
  let group: number[] = [];
  for (const character of input) {
    if (character === "z" && group.length === 0) { output.push(0, 0, 0, 0); continue; }
    const code = character.charCodeAt(0);
    if (code < 33 || code > 117) throw new PdfExtractionError("ASCII85 stream في PDF غير صالح", "PARSER_FAILURE");
    group.push(code - 33);
    if (group.length === 5) {
      let valueNumber = 0;
      for (const item of group) valueNumber = valueNumber * 85 + item;
      output.push((valueNumber >>> 24) & 0xff, (valueNumber >>> 16) & 0xff, (valueNumber >>> 8) & 0xff, valueNumber & 0xff);
      group = [];
    }
  }
  if (group.length > 1) {
    const originalLength = group.length;
    while (group.length < 5) group.push(84);
    let valueNumber = 0;
    for (const item of group) valueNumber = valueNumber * 85 + item;
    for (let index = 0; index < originalLength - 1; index += 1) output.push((valueNumber >>> (24 - index * 8)) & 0xff);
  }
  return new Uint8Array(output);
}

function inflateStream(stream: string, compressed: boolean, ascii85: boolean) {
  const bytes = ascii85 ? ascii85Bytes(stream) : latin1Bytes(stream);
  if (bytes.byteLength > MAX_PDF_STREAM_BYTES) throw new PdfExtractionError("حجم stream في PDF يتجاوز الحد", "RESOURCE_LIMIT");
  if (!compressed) return new TextDecoder("latin1").decode(bytes);
  try {
    const inflated = unzlibSync(bytes);
    if (inflated.byteLength > MAX_PDF_STREAM_BYTES) throw new PdfExtractionError("حجم النص المفكوك في PDF يتجاوز الحد", "RESOURCE_LIMIT");
    return new TextDecoder("latin1").decode(inflated);
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;
    throw new PdfExtractionError("تعذر فك stream مضغوط في PDF", "PARSER_FAILURE");
  }
}

function extractStream(objectBody: string) {
  const streamMarker = /\bstream\r?\n/u.exec(objectBody);
  if (!streamMarker) return "";
  const end = objectBody.indexOf("endstream", streamMarker.index + streamMarker[0].length);
  if (end < 0) throw new PdfExtractionError("stream في PDF غير مكتمل", "PARSER_FAILURE");
  const raw = objectBody.slice(streamMarker.index + streamMarker[0].length, end);
  return inflateStream(raw, /\/FlateDecode\b/u.test(objectBody), /\/ASCII85Decode\b/u.test(objectBody));
}

function pageContents(pageBody: string) {
  const references = [...pageBody.matchAll(/(\d+)\s+0\s+R/gu)].map((match) => Number(match[1]));
  return references;
}

export async function extractPdf(bytes: Uint8Array): Promise<AdapterExtraction> {
  const pdfText = new TextDecoder("latin1").decode(bytes);
  if (!pdfText.startsWith("%PDF-")) throw new PdfExtractionError("ترويسة PDF غير صالحة", "PARSER_FAILURE");
  if (!/%%EOF\s*$/u.test(pdfText.trim())) throw new PdfExtractionError("نهاية PDF غير صالحة", "PARSER_FAILURE");

  const objects = new Map<number, string>();
  for (const match of pdfText.matchAll(/(\d+)\s+0\s+obj\s*([\s\S]*?)endobj/gu)) objects.set(Number(match[1]), match[2]);
  const pages = [...objects.entries()].filter(([, body]) => /\/Type\s*\/Page\b/u.test(body));
  if (!pages.length) throw new PdfExtractionError("لا يمكن تحديد صفحات PDF", "PARSER_FAILURE");
  if (pages.length > AI_MAX_PDF_PAGES) throw new PdfExtractionError("عدد صفحات PDF يتجاوز الحد المسموح", "RESOURCE_LIMIT");

  const pageTexts: string[] = [];
  const boundaries: ExtractionBoundary[] = [];
  const warnings: ExtractionWarning[] = [];
  let offset = 0;
  for (let index = 0; index < pages.length; index += 1) {
    const [, pageBody] = pages[index];
    const chunks = pageContents(pageBody).map((reference) => objects.get(reference)).filter((body): body is string => Boolean(body)).map(extractStream);
    const pageText = chunks.map(extractTextOperators).filter(Boolean).join(" ").trim();
    if (!pageText) warnings.push({ code: "PAGE_TEXT_EMPTY", message: "لم توجد طبقة نصية في الصفحة", location: "page", page: index + 1 });
    pageTexts.push(pageText);
    boundaries.push({ kind: "page", index, page: index + 1, startOffset: offset, endOffset: offset + pageText.length });
    offset += pageText.length + 2;
  }
  const rawText = pageTexts.join("\n\n").trim();
  if (!rawText) throw new PdfExtractionError("PDF لا يحتوي على طبقة نصية؛ OCR مطلوب", "OCR_REQUIRED");
  return { rawText, pageCount: pages.length, boundaries, warnings, parserVersion: "pdf-v1-pure-js-flate-0.8.3", status: warnings.length ? "PARTIAL" : "COMPLETED" };
}
