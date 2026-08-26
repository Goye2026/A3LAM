import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getAvailableDocumentExtractors } from "./ingestion";
import { getAiProviderState } from "./provider";
import { getAiQueueProviderState } from "./queue";
import { getDocumentStorageState } from "./storage";
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
    inference: "DISABLED" as const,
    productionUpload: "DISABLED" as const,
    publicProjection: "DISABLED" as const,
  };
}
