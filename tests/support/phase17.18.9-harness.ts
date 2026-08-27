import { isPrivateDocumentKey } from "@/lib/ai/privacy";
import { AI_COST_CONTROL_POLICY, AI_RATE_LIMIT_POLICY, getAiOperationsReadiness } from "@/lib/ai/operations";
import { AI_QUEUE_DEFAULT_POLICY } from "@/lib/ai/queue";
import { getAiRetentionReadiness } from "@/lib/ai/retention";
import type { AiGenerationMode, AiGenerationLanguage, DocumentProvenance } from "@/lib/ai/types";

export type SandboxOwner = { ownerType: "ADMIN_IDENTITY"; ownerId: string };

export const SANDBOX_ISOLATION = Object.freeze({
  environment: "test-only-isolated-memory",
  database: "IN_MEMORY_ONLY",
  productionDatabase: false,
  network: false,
  realProvider: false,
  realStorage: false,
  realScanner: false,
  realQueue: false,
});

export function assertSandboxOnly(config = SANDBOX_ISOLATION) {
  if (config.environment !== "test-only-isolated-memory" || config.database !== "IN_MEMORY_ONLY" || config.productionDatabase || config.network || config.realProvider || config.realStorage || config.realScanner || config.realQueue) {
    throw new Error("sandbox isolation violation");
  }
  return true as const;
}

export type SandboxScanStatus = "SAFE" | "INFECTED" | "SCAN_ERROR" | "UNAVAILABLE";

export class DeterministicSandboxScanner {
  status: SandboxScanStatus = "SAFE";
  readonly records: Array<{ status: SandboxScanStatus; bytes: number }> = [];

  scan(bytes: Uint8Array) {
    const marker = new TextDecoder("latin1").decode(bytes);
    const status = marker.includes("EICAR-SYNTHETIC-TEST") ? "INFECTED" : this.status;
    this.records.push({ status, bytes: bytes.byteLength });
    return { status, allowed: status === "SAFE" } as const;
  }

  assertSafe(bytes: Uint8Array) {
    const result = this.scan(bytes);
    if (!result.allowed) throw new Error(`SCAN_${result.status}`);
    return result;
  }
}

type StoredObject = {
  owner: SandboxOwner;
  metadata: { key: string; documentType: "txt" | "pdf" | "docx"; mimeType: string; sizeBytes: number };
  bytes: Uint8Array;
};

function assertSafePrivateKey(key: string) {
  if (!isPrivateDocumentKey(key) || key.includes("..") || key.startsWith("/") || key.includes("\\")) throw new Error("PRIVATE_KEY_INVALID");
}

export class SandboxPrivateStorage {
  readonly objects = new Map<string, StoredObject>();
  private readonly detached = new Set<string>();

  async put(owner: SandboxOwner, metadata: StoredObject["metadata"], bytes: Uint8Array) {
    assertSafePrivateKey(metadata.key);
    this.objects.set(metadata.key, { owner, metadata: { ...metadata }, bytes: bytes.slice() });
    this.detached.delete(metadata.key);
    return { key: metadata.key } as const;
  }

  async getForOwner(owner: SandboxOwner, key: string) {
    assertSafePrivateKey(key);
    const object = this.objects.get(key);
    if (!object || object.owner.ownerType !== owner.ownerType || object.owner.ownerId !== owner.ownerId || this.detached.has(key)) throw new Error("PRIVATE_OBJECT_NOT_FOUND");
    return object.bytes.slice();
  }

  async getMetadataForOwner(owner: SandboxOwner, key: string) {
    await this.getForOwner(owner, key);
    const object = this.objects.get(key);
    return object ? { ...object.metadata } : null;
  }

  async existsForOwner(owner: SandboxOwner, key: string) {
    try {
      await this.getForOwner(owner, key);
      return true;
    } catch {
      return false;
    }
  }

  async deleteForOwner(owner: SandboxOwner, key: string) {
    await this.getForOwner(owner, key);
    this.objects.delete(key);
    this.detached.delete(key);
  }

  detach(key: string) {
    assertSafePrivateKey(key);
    if (!this.objects.has(key)) return false;
    this.detached.add(key);
    return true;
  }

  async createSignedRetrieval() {
    throw new Error("SIGNED_PUBLIC_URL_DISABLED");
  }
}

export type SandboxQueueStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "RETRYABLE" | "FAILED";
export type SandboxQueueJob = {
  id: string;
  idempotencyKey: string;
  status: SandboxQueueStatus;
  attempts: number;
  availableAt: number;
  staleAfterMs: number;
  errorCode?: string;
};

export class SandboxProcessingQueue {
  readonly jobs = new Map<string, SandboxQueueJob>();
  readonly deliveries: string[] = [];
  workerAvailable = true;
  private readonly inflight = new Map<string, Promise<SandboxQueueStatus>>();

  enqueue(input: { id: string; idempotencyKey: string }) {
    if (!this.workerAvailable) throw new Error("QUEUE_WORKER_UNAVAILABLE");
    const duplicate = [...this.jobs.values()].find((job) => job.idempotencyKey === input.idempotencyKey);
    if (duplicate) return { duplicate: true, job: duplicate } as const;
    const job: SandboxQueueJob = { id: input.id, idempotencyKey: input.idempotencyKey, status: "QUEUED", attempts: 0, availableAt: 0, staleAfterMs: AI_QUEUE_DEFAULT_POLICY.staleAfterMs };
    this.jobs.set(job.id, job);
    return { duplicate: false, job } as const;
  }

  dequeue(id: string, now = 0) {
    if (!this.workerAvailable) throw new Error("QUEUE_WORKER_UNAVAILABLE");
    const job = this.require(id);
    if (job.status === "RUNNING" && now >= job.availableAt + job.staleAfterMs) {
      job.status = "FAILED";
      job.errorCode = "STALE_JOB";
      return null;
    }
    if (job.status !== "QUEUED" && job.status !== "RETRYABLE") return null;
    if (now < job.availableAt) return null;
    job.status = "RUNNING";
    job.attempts += 1;
    this.deliveries.push(job.id);
    return job;
  }

  async deliver(id: string, worker: () => Promise<void>, now = 0) {
    const existing = this.inflight.get(id);
    if (existing) return existing;
    const promise = this.runDelivery(id, worker, now).finally(() => this.inflight.delete(id));
    this.inflight.set(id, promise);
    return promise;
  }

  private async runDelivery(id: string, worker: () => Promise<void>, now: number): Promise<SandboxQueueStatus> {
    const job = this.require(id);
    if (job.status === "SUCCEEDED" || job.status === "FAILED") return job.status;
    const running = this.dequeue(id, now);
    if (!running) return job.status;
    try {
      await worker();
      job.status = "SUCCEEDED";
      return job.status;
    } catch (error) {
      if (job.attempts >= 3) {
        job.status = "FAILED";
        job.errorCode = error instanceof Error ? error.message : "WORKER_FAILURE";
        return job.status;
      }
      job.status = "RETRYABLE";
      job.errorCode = error instanceof Error ? error.message : "WORKER_FAILURE";
      job.availableAt = now + AI_QUEUE_DEFAULT_POLICY.baseBackoffMs * 2 ** (job.attempts - 1);
      return job.status;
    }
  }

  recoverStale(now: number) {
    const stale = [...this.jobs.values()].filter((job) => job.status === "RUNNING" && now >= job.availableAt + job.staleAfterMs);
    for (const job of stale) {
      job.status = "FAILED";
      job.errorCode = "STALE_JOB";
    }
    return stale.map((job) => job.id);
  }

  private require(id: string) {
    const job = this.jobs.get(id);
    if (!job) throw new Error("QUEUE_JOB_NOT_FOUND");
    return job;
  }
}

export type SandboxFactReviewAction = "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE";
export type SandboxFact = { id: string; fieldPath: string; value: unknown; reviewStatus: "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED" | "REQUEST_SOURCE"; provenance: DocumentProvenance[] };

export function reviewSandboxFact(fact: SandboxFact, action: SandboxFactReviewAction, reviewerId: string, reviewedValue?: unknown) {
  const originalValue = fact.value;
  fact.value = action === "EDIT" ? reviewedValue : fact.value;
  fact.reviewStatus = action === "ACCEPT" ? "ACCEPTED" : action === "EDIT" ? "EDITED" : action === "REJECT" ? "REJECTED" : "REQUEST_SOURCE";
  return { factId: fact.id, reviewerId, action, originalValue, reviewedValue: fact.value } as const;
}

export type SandboxAuditEvent = {
  correlationId: string;
  jobId: string | null;
  documentId: string | null;
  stage: "UPLOAD" | "SCAN" | "QUEUE" | "EXTRACTION" | "GENERATION" | "REVIEW" | "DELETION";
  status: string;
  durationMs: number | null;
  attempt: number | null;
  errorClass: string | null;
};

export class SandboxTelemetry {
  readonly events: SandboxAuditEvent[] = [];

  record(input: SandboxAuditEvent & { rawContent?: unknown; prompt?: unknown; providerResponse?: unknown }) {
    const { correlationId, jobId, documentId, stage, status, durationMs, attempt, errorClass } = input;
    this.events.push({ correlationId, jobId, documentId, stage, status, durationMs, attempt, errorClass });
  }
}

export class SandboxOperationsGate {
  private readonly usage = new Map<string, number>();
  private activeJobs = 0;

  consume(role: "ADMIN" | "SUPER_ADMIN" | "EDITOR" | "MODERATOR", operation: "upload" | "extraction" | "generation") {
    const limit = operation === "upload" ? (AI_RATE_LIMIT_POLICY.uploadPerHourByRole[role] ?? 0) : operation === "extraction" ? AI_RATE_LIMIT_POLICY.extractionJobsPerHour : AI_RATE_LIMIT_POLICY.generationRequestsPerHour;
    const key = `${role}:${operation}`;
    const used = this.usage.get(key) ?? 0;
    if (used >= limit) throw new Error("RATE_LIMITED");
    this.usage.set(key, used + 1);
    return { allowed: true, used: used + 1, limit } as const;
  }

  acquireConcurrency() {
    if (this.activeJobs >= AI_RATE_LIMIT_POLICY.maxConcurrentJobs) throw new Error("CONCURRENCY_LIMITED");
    this.activeJobs += 1;
    return this.activeJobs;
  }

  releaseConcurrency() {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
  }

  snapshot() { return { activeJobs: this.activeJobs, maxConcurrentJobs: AI_RATE_LIMIT_POLICY.maxConcurrentJobs, maxRetries: AI_COST_CONTROL_POLICY.maxRetries }; }
}

export class SandboxRetentionController {
  readonly automaticExecution = false;

  evaluate(createdAt: number, now: number, retentionDays = 30) {
    return now - createdAt >= retentionDays * 24 * 60 * 60 * 1000 ? "ELIGIBLE" as const : "KEEP" as const;
  }

  async executeAutomatic() {
    return { executed: false as const, reason: "EXECUTOR_NOT_CONFIGURED" as const };
  }

  async deleteOwnedDocument(storage: SandboxPrivateStorage, owner: SandboxOwner, key: string) {
    await storage.deleteForOwner(owner, key);
    return { executed: true as const, scope: owner.ownerId };
  }
}

export class SandboxDraftBoundary {
  readonly drafts: Array<{ id: string; mode: AiGenerationMode; language: AiGenerationLanguage; status: "DRAFT" }> = [];
  publicationAttempts = 0;
  personCreationAttempts = 0;
  profileCreationAttempts = 0;

  createDraft(id: string, mode: AiGenerationMode, language: AiGenerationLanguage) {
    const draft = { id, mode, language, status: "DRAFT" as const };
    this.drafts.push(draft);
    return draft;
  }

  publish() {
    this.publicationAttempts += 1;
    throw new Error("PUBLICATION_BLOCKED_DRAFT_ONLY");
  }

  createPerson() {
    this.personCreationAttempts += 1;
    throw new Error("PERSON_CREATION_BLOCKED");
  }

  createProfile() {
    this.profileCreationAttempts += 1;
    throw new Error("PROFILE_CREATION_BLOCKED");
  }
}

export function productionContractSnapshot() {
  return {
    operations: getAiOperationsReadiness(),
    retention: getAiRetentionReadiness(),
    queue: AI_QUEUE_DEFAULT_POLICY,
    providerCalls: 0,
    uploads: 0,
    migrations: 0,
    productionMutations: 0,
  } as const;
}
