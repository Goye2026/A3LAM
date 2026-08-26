import { getStorageProviderState } from "@/lib/storage/provider";
import { getAvailableDocumentExtractors } from "./ingestion";
import { getAiProviderState } from "./provider";
import type { AiWorkspaceSnapshot, DocumentProcessingState } from "./types";

export function getAiWorkspaceSnapshot(): AiWorkspaceSnapshot {
  const storage = getStorageProviderState() === "configured" ? "AVAILABLE" : "REQUIRES_CONFIGURATION";
  const documentProcessing: DocumentProcessingState = storage === "AVAILABLE" && getAvailableDocumentExtractors().length > 0 ? "AVAILABLE" : "REQUIRES_CONFIGURATION";
  return {
    provider: getAiProviderState(),
    documentProcessing,
    storage,
    persistence: "NOT_INITIALIZED",
    counts: null,
  };
}

export function getAiWorkspaceCapabilities() {
  return {
    supportedTypes: ["pdf", "docx", "txt"] as const,
    availableExtractors: getAvailableDocumentExtractors(),
    inference: "DISABLED" as const,
    productionUpload: "DISABLED" as const,
    publicProjection: "DISABLED" as const,
  };
}
