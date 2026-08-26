import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getAvailableDocumentExtractors } from "./ingestion";
import { getAiGenerationProviderStatus, getAiProviderState } from "./provider";
import { getAiQueueProviderState } from "./queue";
import { getDocumentStorageState } from "./storage";
import {
  AI_DOCUMENT_MAX_BYTES,
  AI_EXTRACTED_TEXT_MAX_BYTES,
  AI_MAX_DOCX_DECOMPRESSED_BYTES,
  AI_MAX_DOCX_ENTRY_COUNT,
  AI_MAX_DOCX_ENTRY_BYTES,
  AI_MAX_PDF_PAGES,
  AI_MAX_PARAGRAPHS,
  AI_MAX_TABLE_CELLS,
} from "./validation";
import type { AiWorkspaceSnapshot, DocumentProcessingState } from "./types";

export async function getAiPersistenceState(): Promise<AiWorkspaceSnapshot["persistence"]> {
  try {
    await getDb().execute(sql`select 1 from ai_documents limit 1`);
    return "AVAILABLE";
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01") return "REQUIRES_MIGRATION";
    return "NOT_INITIALIZED";
  }
}

export async function getAiWorkspaceSnapshot(): Promise<AiWorkspaceSnapshot> {
  const storage = getDocumentStorageState();
  const documentProcessing: DocumentProcessingState = storage === "AVAILABLE" && getAvailableDocumentExtractors().length > 0 ? "AVAILABLE" : "REQUIRES_CONFIGURATION";
  return {
    provider: getAiProviderState(),
    generationProvider: getAiGenerationProviderStatus(),
    documentProcessing,
    storage,
    persistence: await getAiPersistenceState(),
    queue: getAiQueueProviderState(),
    malwareScanning: "REQUIRES_CONFIGURATION",
    retentionPolicy: "REQUIRES_CONFIGURATION",
    counts: null,
  };
}

export function getAiWorkspaceCapabilities() {
  return {
    supportedTypes: ["pdf", "docx", "txt"] as const,
    availableExtractors: getAvailableDocumentExtractors(),
    parserStatus: {
      pdf: "AVAILABLE_LOCAL_ONLY",
      docx: "AVAILABLE_LOCAL_ONLY",
      txt: "AVAILABLE_LOCAL_ONLY",
    } as const,
    generationModes: ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"] as const,
    outputLanguages: ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"] as const,
    limits: {
      maxInputBytes: AI_DOCUMENT_MAX_BYTES,
      maxExtractedTextBytes: AI_EXTRACTED_TEXT_MAX_BYTES,
      maxPdfPages: AI_MAX_PDF_PAGES,
      maxParagraphs: AI_MAX_PARAGRAPHS,
      maxTableCells: AI_MAX_TABLE_CELLS,
      maxDocxEntries: AI_MAX_DOCX_ENTRY_COUNT,
      maxDocxDecompressedBytes: AI_MAX_DOCX_DECOMPRESSED_BYTES,
      maxDocxEntryBytes: AI_MAX_DOCX_ENTRY_BYTES,
    },
    inference: "DISABLED" as const,
    productionUpload: "DISABLED" as const,
    publicProjection: "DISABLED" as const,
  };
}
