import type { AiProcessingJobRecord } from "./types";

export type AiQueueProviderState = "AVAILABLE" | "REQUIRES_CONFIGURATION";

export class AiQueueUnavailableError extends Error {
  constructor(message = "AI processing queue is not configured") { super(message); this.name = "AiQueueUnavailableError"; }
}

export type ProcessingQueue = {
  readonly state: AiQueueProviderState;
  enqueue(job: AiProcessingJobRecord): Promise<void>;
};

export function getAiQueueProviderState(): AiQueueProviderState { return "REQUIRES_CONFIGURATION"; }

export const unavailableProcessingQueue: ProcessingQueue = {
  state: "REQUIRES_CONFIGURATION",
  async enqueue() { throw new AiQueueUnavailableError(); },
};
