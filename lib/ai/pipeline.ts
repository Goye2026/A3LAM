import { createPrivateDocumentKey } from "./privacy";
import { createAiDocument } from "./persistence";
import { unavailableProcessingQueue, type ProcessingQueue } from "./queue";
import { unavailableDocumentStorage, type DocumentStorage } from "./storage";
import type { AiDocumentOwner, AiDocumentListItem } from "./persistence";
import type { AiProcessingJobRecord } from "./types";
import type { ValidatedAiDocument } from "./validation";

export type AiSubmissionDependencies = {
  storage?: DocumentStorage;
  queue?: ProcessingQueue;
};

export async function submitAiDocument(input: ValidatedAiDocument, owner: AiDocumentOwner, actorId: string | null, dependencies: AiSubmissionDependencies = {}) {
  const storage = dependencies.storage ?? unavailableDocumentStorage;
  const queue = dependencies.queue ?? unavailableProcessingQueue;
  if (storage.state !== "AVAILABLE" || queue.state !== "AVAILABLE") throw new Error("AI ingestion dependencies require configuration");
  const key = createPrivateDocumentKey(owner, input);
  const stored = await storage.put({ key, documentType: input.documentType, mimeType: input.mimeType, sizeBytes: input.sizeBytes }, input.bytes);
  const created = await createAiDocument(input, owner, actorId, stored.key);
  if (created.duplicate || !created.job) return created;
  try {
    await queue.enqueue(created.job);
  } catch (error) {
    await storage.delete(stored.key).catch(() => undefined);
    throw error;
  }
  return created;
}

export type SubmittedAiDocument = { document: AiDocumentListItem; job: AiProcessingJobRecord };
