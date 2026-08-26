import type { DocumentExtractionResult, DocumentMetadata, ExtractionBoundary, ExtractionWarning, AiDocumentType } from "./types";
import { assertExtractedText, validateAiDocument, type ValidatedAiDocument } from "./validation";
import { extractDocx, DocxExtractionError } from "./extraction/docx";
import { extractPdf, PdfExtractionError } from "./extraction/pdf";
import type { AdapterExtraction } from "./extraction/adapter";
import { createParagraphBoundaries, createSectionBoundaries, detectSections } from "./extraction/sections";
import { detectExtractionLanguage } from "./extraction/normalize";
import { extractCandidateFacts } from "./extraction/candidates";

export const EXTRACTION_VERSION = "extraction-v1";

export class DocumentExtractionError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "DocumentExtractionError";
    this.code = code;
  }
}

export class DocumentExtractionUnavailableError extends DocumentExtractionError {
  constructor(message = "استخلاص هذا النوع من المستندات غير مهيأ حاليًا") {
    super(message, "UNAVAILABLE");
    this.name = "DocumentExtractionUnavailableError";
  }
}

export type DocumentExtractor = {
  name: string;
  documentType: AiDocumentType;
  parserVersion: string;
  extract(bytes: Uint8Array): Promise<AdapterExtraction>;
};

const txtExtractor: DocumentExtractor = {
  name: "deterministic-utf8-text",
  documentType: "txt",
  parserVersion: "txt-v1-native-utf8",
  async extract(bytes) {
    let decoded: string;
    try {
      decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new DocumentExtractionError("تعذر قراءة ترميز المستند النصي", "INVALID_FILE");
    }
    const rawText = decoded.replace(/^\uFEFF/u, "");
    const normalized = assertExtractedText(rawText);
    return {
      rawText: normalized,
      pageCount: null,
      boundaries: createParagraphBoundaries(normalized),
      warnings: [],
      parserVersion: "txt-v1-native-utf8",
      status: "COMPLETED",
    };
  },
};

const pdfExtractor: DocumentExtractor = {
  name: "pdfjs-dist-legacy",
  documentType: "pdf",
  parserVersion: "pdf-v1-pdfjs-6.2.108",
  async extract(bytes) {
    try {
      return await extractPdf(bytes);
    } catch (error) {
      if (error instanceof PdfExtractionError) throw new DocumentExtractionError(error.message, error.code);
      throw new DocumentExtractionError("تعذر تحليل PDF", "PARSER_FAILURE");
    }
  },
};

const docxExtractor: DocumentExtractor = {
  name: "fflate-xmldom-wordprocessingml",
  documentType: "docx",
  parserVersion: "docx-v1-fflate-0.8.3-xmldom-0.9.12",
  async extract(bytes) {
    try {
      return extractDocx(bytes);
    } catch (error) {
      if (error instanceof DocxExtractionError) throw new DocumentExtractionError(error.message, error.code);
      throw new DocumentExtractionError("تعذر تحليل DOCX", "PARSER_FAILURE");
    }
  },
};

const extractors: Record<AiDocumentType, DocumentExtractor> = { txt: txtExtractor, pdf: pdfExtractor, docx: docxExtractor };

export function getAvailableDocumentExtractors() {
  return Object.keys(extractors) as AiDocumentType[];
}

function mergeBoundaries(adapter: AdapterExtraction, normalizedText: string, sections: ReturnType<typeof detectSections>): ExtractionBoundary[] {
  const paragraphs = createParagraphBoundaries(normalizedText);
  const sectionBoundaries = createSectionBoundaries(sections, normalizedText.length);
  return [...adapter.boundaries, ...paragraphs, ...sectionBoundaries];
}

function buildResult(file: ValidatedAiDocument, adapter: AdapterExtraction): DocumentExtractionResult {
  const normalizedText = assertExtractedText(adapter.rawText);
  const sections = detectSections(normalizedText);
  const warnings: ExtractionWarning[] = [...adapter.warnings];
  if (adapter.status === "PARTIAL") warnings.push({ code: "PARTIAL_EXTRACTION", message: "اكتمل الاستخلاص مع تحذيرات قابلة للمراجعة", location: "document" });
  const metadata: DocumentMetadata = {
    documentType: file.documentType,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    checksumSha256: file.checksumSha256,
    extractedAt: new Date().toISOString(),
    extractor: extractors[file.documentType].name,
  };
  const base = {
    metadata,
    status: adapter.status,
    normalizedText,
    characterCount: Array.from(normalizedText).length,
    pageCount: adapter.pageCount,
    boundaries: mergeBoundaries(adapter, normalizedText, sections),
    warnings,
    language: detectExtractionLanguage(normalizedText),
    sections,
    parserVersion: adapter.parserVersion,
    extractionVersion: EXTRACTION_VERSION,
    checksumSha256: file.checksumSha256,
    provenance: { sourceType: "document" as const, fileName: file.originalName, documentId: file.checksumSha256 },
  };
  const candidateFacts = extractCandidateFacts(base).map(({ fieldPath, fact, evidence }) => ({ fieldPath, value: fact.value, confidence: fact.confidence, classification: fact.classification, provenance: fact.provenance, evidence }));
  return {
    ...base,
    candidateFacts,
  };
}

export const documentIngestionService = {
  async extract(file: File): Promise<DocumentExtractionResult> {
    const validated = await validateAiDocument(file);
    return this.extractValidated(validated);
  },
  async extractValidated(file: ValidatedAiDocument): Promise<DocumentExtractionResult> {
    const extractor = extractors[file.documentType];
    if (!extractor) throw new DocumentExtractionUnavailableError();
    return buildResult(file, await extractor.extract(file.bytes));
  },
};

export const documentExtractionService = documentIngestionService;
