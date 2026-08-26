import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import { extractCandidateFacts } from "@/lib/ai/extraction/candidates";
import { detectSections } from "@/lib/ai/extraction/sections";
import { documentIngestionService, DocumentExtractionError } from "@/lib/ai/ingestion";
import { normalizeExtractedText } from "@/lib/ai/validation";

const fixture = (name: string) => resolve(process.cwd(), "fixtures/ai", name);

async function fixtureFile(name: string, type: string) {
  return new File([await readFile(fixture(name))], name, { type });
}

describe("Phase 17.18.3 extraction engine", () => {
  it("extracts Arabic, English, mixed text and deterministic candidate facts", async () => {
    const arabic = await documentIngestionService.extract(await fixtureFile("arabic-cv.txt", "text/plain"));
    expect(arabic.status).toBe("COMPLETED");
    expect(arabic.language).toBe("mixed");
    expect(arabic.sections.map((section) => section.type)).toEqual(expect.arrayContaining(["EDUCATION", "EXPERIENCE"]));
    expect(arabic.boundaries.some((boundary) => boundary.kind === "paragraph")).toBe(true);
    expect(arabic.parserVersion).toBe("txt-v1-native-utf8");
    expect(arabic.provenance.documentId).toBe(arabic.checksumSha256);

    const mixed = await documentIngestionService.extract(await fixtureFile("mixed-cv.txt", "text/plain"));
    expect(mixed.language).toBe("mixed");
    expect(extractCandidateFacts(mixed).map((fact) => fact.fieldPath)).toEqual(expect.arrayContaining(["contact.email", "contact.website"]));
    expect(extractCandidateFacts(mixed)[0]?.fact.classification).toBe("NEEDS_VERIFICATION");
  });

  it("normalizes BOM, CRLF, controls and repeated blank lines without flattening paragraphs", () => {
    expect(normalizeExtractedText("\uFEFFالسطر الأول\r\n\r\n\r\nالسطر\u0000 الثاني\t هنا")).toBe("السطر الأول\n\nالسطر الثاني هنا");
    expect(detectSections("التعليم\nمثال\n\nEXPERIENCE\nExample").map((section) => section.type)).toEqual(["EDUCATION", "EXPERIENCE"]);
  });

  it("rejects empty, whitespace-only, malformed encoding, HTML and oversized TXT", async () => {
    await expect(documentIngestionService.extract(await fixtureFile("empty.txt", "text/plain"))).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" });
    await expect(documentIngestionService.extract(await fixtureFile("whitespace.txt", "text/plain"))).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" });
    await expect(documentIngestionService.extract(await fixtureFile("malformed-encoding.txt", "text/plain"))).rejects.toMatchObject({ code: "INVALID_FILE" });
    const html = new File(["<!doctype html><script>alert(1)</script>"], "payload.txt", { type: "text/plain" });
    await expect(documentIngestionService.extract(html)).rejects.toMatchObject({ code: "INVALID_FILE" });
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "oversized.txt", { type: "text/plain" });
    await expect(documentIngestionService.extract(oversized)).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("extracts multi-page text PDFs and distinguishes OCR-required and malformed PDFs", async () => {
    const result = await documentIngestionService.extract(await fixtureFile("sample.pdf", "application/pdf"));
    expect(result.status).toBe("COMPLETED");
    expect(result.pageCount).toBe(2);
    expect(result.boundaries.filter((boundary) => boundary.kind === "page")).toHaveLength(2);
    expect(result.normalizedText).toContain("Synthetic PDF extraction fixture");
    expect(result.parserVersion).toContain("pdf-v1");

    await expect(documentIngestionService.extract(await fixtureFile("empty.pdf", "application/pdf"))).rejects.toMatchObject({ code: "OCR_REQUIRED" });
    await expect(documentIngestionService.extract(await fixtureFile("malformed.pdf", "application/pdf"))).rejects.toMatchObject({ code: "PARSER_FAILURE" });
  });

  it("extracts bounded DOCX paragraphs and tables while rejecting unsafe archives", async () => {
    const result = await documentIngestionService.extract(await fixtureFile("sample.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    expect(result.status).toBe("COMPLETED");
    expect(result.pageCount).toBeNull();
    expect(result.normalizedText).toContain("Synthetic DOCX extraction fixture");
    expect(result.normalizedText).toContain("Testing");
    expect(result.parserVersion).toContain("docx-v1");

    await expect(documentIngestionService.extract(await fixtureFile("malformed.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).rejects.toMatchObject({ code: "DOCX_INVALID" });
    await expect(documentIngestionService.extract(await fixtureFile("suspicious.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).rejects.toMatchObject({ code: "DOCX_UNSAFE_ARCHIVE" });

    const traversalBytes = zipSync({ "[Content_Types].xml": new TextEncoder().encode("[Content_Types].xml"), "word/document.xml": new TextEncoder().encode("word/document.xml"), "../evil.xml": new TextEncoder().encode("evil") });
    const traversal = new File([traversalBytes], "traversal.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    await expect(documentIngestionService.extract(traversal)).rejects.toBeInstanceOf(DocumentExtractionError);
  });
});
