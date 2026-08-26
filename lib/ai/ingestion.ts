import { assertExtractedText, validateAiDocument, type ValidatedAiDocument } from "./validation";
import type { DocumentExtractionResult, DocumentMetadata, AiDocumentType } from "./types";

export class DocumentExtractionUnavailableError extends Error {
  constructor(message = "استخلاص هذا النوع من المستندات غير مهيأ حاليًا") { super(message); this.name = "DocumentExtractionUnavailableError"; }
}

export type DocumentExtractor = {
  name: string;
  documentType: AiDocumentType;
  extract(bytes: Uint8Array): Promise<string>;
};

const txtExtractor: DocumentExtractor = {
  name: "deterministic-utf8-text",
  documentType: "txt",
  async extract(bytes) {
    let decoded: string;
    try {
      decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new DocumentExtractionUnavailableError("تعذر قراءة ترميز المستند النصي");
    }
    return assertExtractedText(decoded);
  },
};

const extractors: Partial<Record<AiDocumentType, DocumentExtractor>> = { txt: txtExtractor };

export function getAvailableDocumentExtractors() {
  return Object.values(extractors).filter((extractor): extractor is DocumentExtractor => Boolean(extractor)).map((extractor) => extractor.documentType);
}

async function extractValidatedDocument(file: ValidatedAiDocument, extractor: DocumentExtractor): Promise<DocumentExtractionResult> {
  const normalizedText = await extractor.extract(file.bytes);
  const metadata: DocumentMetadata = {
    documentType: file.documentType,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    checksumSha256: file.checksumSha256,
    extractedAt: new Date().toISOString(),
    extractor: extractor.name,
  };
  return { metadata, normalizedText };
}

export const documentIngestionService = {
  async extract(file: File) {
    const validated = await validateAiDocument(file);
    const extractor = extractors[validated.documentType];
    if (!extractor) throw new DocumentExtractionUnavailableError();
    return extractValidatedDocument(validated, extractor);
  },
};
