import { strToU8, zipSync } from "fflate";

export function syntheticPdf(options: { pageCount?: number; text?: string; filter?: string; stream?: string } = {}) {
  const pageCount = options.pageCount ?? 1;
  const text = options.text ?? "(Synthetic PDF) Tj";
  const stream = options.stream ?? text;
  const objects = ["%PDF-1.7"];
  for (let index = 0; index < pageCount; index += 1) {
    const contentId = 2 + index * 2;
    const pageId = contentId + 1;
    const filter = options.filter ? ` /Filter /${options.filter}` : "";
    objects.push(`${pageId} 0 obj << /Type /Page /Contents ${contentId} 0 R >> endobj`);
    objects.push(`${contentId} 0 obj << /Length ${stream.length}${filter} >>\nstream\n${stream}\nendstream endobj`);
  }
  objects.push("%%EOF");
  return new TextEncoder().encode(objects.join("\n"));
}

const contentTypes = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`;
const safeDocumentXml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Synthetic DOCX evidence</w:t></w:r></w:p></w:body></w:document>`;

export function syntheticDocx(extra: Record<string, Uint8Array | string> = {}, documentXml = safeDocumentXml) {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypes),
    "word/document.xml": strToU8(documentXml),
  };
  for (const [name, value] of Object.entries(extra)) files[name] = typeof value === "string" ? strToU8(value) : value;
  return zipSync(files, { level: 6 });
}

export function syntheticDocxWithEntries(entries: number) {
  const extras: Record<string, Uint8Array> = {};
  for (let index = 0; index < entries; index += 1) extras[`word/extra-${index}.xml`] = new Uint8Array();
  return syntheticDocx(extras);
}

export function syntheticDocxWithLargeEntry(bytes: number) {
  return syntheticDocx({ "word/large.bin": new Uint8Array(bytes) });
}

export function syntheticDocxWithExternalRelationship() {
  return syntheticDocx({
    "word/_rels/document.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" TargetMode="External" Target="https://untrusted.invalid/resource" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"/></Relationships>`,
    "word/vbaProject.bin": new Uint8Array([0, 1, 2, 3]),
    "word/embeddings/oleObject1.bin": new Uint8Array([4, 5, 6, 7]),
  });
}
