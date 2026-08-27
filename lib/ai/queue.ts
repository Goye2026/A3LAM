import type { AiProcessingJobRecord } from "./types";

export type AiQueueProviderState = "AVAILABLE" | "REQUIRES_CONFIGURATION";
export const AI_QUEUE_JOB_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "RETRYABLE", "CANCELLED"] as const;
export type AiQueueJobStatus = (typeof AI_QUEUE_JOB_STATUSES)[number];

export type AiQueueJob = AiProcessingJobRecord & {
  staleAfterMs?: number;
  maxAttempts?: number;
};

export type AiQueuePolicy = {
  maxRetries: number;
  baseBackoffMs: number;
  timeoutMs: number;
  staleAfterMs: number;
  duplicateKey: "idempotencyKey";
  heavyWorkOutsideHttp: true;
};

export class AiQueueUnavailableError extends Error {
  constructor(message = "AI processing queue is not configured") { super(message); this.name = "AiQueueUnavailableError"; }
}

export type ProcessingQueue = {
  readonly state: AiQueueProviderState;
  enqueue(job: AiProcessingJobRecord): Promise<void>;
};

export const AI_QUEUE_DEFAULT_POLICY: AiQueuePolicy = Object.freeze({
  maxRetries: 3,
  baseBackoffMs: 1_000,
  timeoutMs: 60_000,
  staleAfterMs: 5 * 60_000,
  duplicateKey: "idempotencyKey",
  heavyWorkOutsideHttp: true,
});

export function getAiQueueProviderState(): AiQueueProviderState { return "REQUIRES_CONFIGURATION"; }

export function getAiQueueReadiness() {
  return {
    state: getAiQueueProviderState(),
    policy: AI_QUEUE_DEFAULT_POLICY,
    worker: "REQUIRES_CONFIGURATION" as const,
    productionProvisioned: false as const,
  };
}

export const unavailableProcessingQueue: ProcessingQueue = {
  state: "REQUIRES_CONFIGURATION",
  async enqueue() { throw new AiQueueUnavailableError(); },
};
