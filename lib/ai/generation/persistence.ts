import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { buildAiAuditLogInput } from "../audit";
import { AiFactValidationError, validateProvenance } from "../facts";
import { claimStatusAfterReview, validateGenerationReviewInput } from "./review";
import { AiPersistenceUnavailableError, type AiDocumentOwner } from "../persistence";
import type { AiAuditAction, AiClaimStatus, AiGeneratedClaim, AiGenerationAttemptRecord, AiGenerationJobRecord, AiGenerationLanguage, AiGenerationMode, AiGenerationReviewInput, AiGenerationResult } from "../types";

export const AI_GENERATION_MAX_RETRY_ATTEMPTS = 3;

function missingSchema(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01";
}

async function withPersistenceError<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) { if (missingSchema(error)) throw new AiPersistenceUnavailableError("AI generation persistence requires migration"); throw error; }
}

function iso(value: Date | string) { return value instanceof Date ? value.toISOString() : value; }
function audit(action: AiAuditAction, actorId: string | null, entityType: "ai_generation_job" | "ai_generation_claim", entityId: string, field: string, oldValue: string | null, newValue: string | null) {
  return buildAiAuditLogInput({ action, actorType: "admin", actorId, entityType, entityId, field, oldValue, newValue, reason: null }, randomUUID());
}

function safeJob(row: typeof schema.aiGenerationJobs.$inferSelect): AiGenerationJobRecord {
  return { id: row.id, documentId: row.documentId, idempotencyKey: row.idempotencyKey, mode: row.mode, outputLanguage: row.outputLanguage, status: row.status, providerId: row.providerId, modelId: row.modelId, attempt: row.attempt, qualityGate: row.qualityGate, errorCode: row.errorCode, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function safeAttempt(row: typeof schema.aiGenerationAttempts.$inferSelect): AiGenerationAttemptRecord {
  return { id: row.id, jobId: row.jobId, attempt: row.attempt, status: row.status, errorCode: row.errorCode, createdAt: iso(row.createdAt) };
}

function safeClaim(row: typeof schema.aiGenerationClaims.$inferSelect): AiGeneratedClaim {
  return { id: row.id, fieldPath: row.fieldPath, value: row.value, sourceFactIds: Array.isArray(row.sourceFactIds) ? row.sourceFactIds.filter((value): value is string => typeof value === "string") : [], evidenceIds: Array.isArray(row.evidenceIds) ? row.evidenceIds.filter((value): value is string => typeof value === "string") : [], confidence: row.confidence, classification: row.classification, status: row.claimStatus, provenance: Array.isArray(row.provenance) ? row.provenance as AiGeneratedClaim["provenance"] : [] };
}

export async function createAiGenerationJob(input: { documentId: string; owner: AiDocumentOwner; mode: AiGenerationMode; outputLanguage: AiGenerationLanguage; actorId: string | null }) {
  return withPersistenceError(async () => {
    const db = getDb();
    const idempotencyKey = `${input.owner.ownerType}:${input.owner.ownerId}:${input.documentId}:${input.mode}:${input.outputLanguage}`;
    const existing = await db.select().from(schema.aiGenerationJobs).where(eq(schema.aiGenerationJobs.idempotencyKey, idempotencyKey)).limit(1);
    if (existing[0]) return { duplicate: true as const, job: safeJob(existing[0]) };
    const now = new Date();
    const jobId = randomUUID();
    const result = await db.transaction(async (tx) => {
      const document = await tx.select({ id: schema.aiDocuments.id }).from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, input.documentId), eq(schema.aiDocuments.ownerType, input.owner.ownerType), eq(schema.aiDocuments.ownerId, input.owner.ownerId))).limit(1);
      if (!document[0]) return null;
      const [job] = await tx.insert(schema.aiGenerationJobs).values({ id: jobId, documentId: input.documentId, idempotencyKey, mode: input.mode, outputLanguage: input.outputLanguage, status: "QUEUED", providerId: null, modelId: null, attempt: 0, qualityGate: "PENDING", errorCode: null, outputJson: null, createdAt: now, updatedAt: now }).returning();
      await tx.insert(schema.auditLogs).values(audit("ai.generation.requested", input.actorId, "ai_generation_job", jobId, "mode", null, input.mode));
      return job;
    });
    return result ? { duplicate: false as const, job: safeJob(result) } : null;
  });
}

export async function startAiGenerationJob(id: string, owner: AiDocumentOwner, providerId: string, modelId: string, actorId: string | null) {
  return withPersistenceError(async () => {
    if (!providerId.trim() || !modelId.trim()) throw new AiFactValidationError("هوية provider/model مطلوبة");
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ job: schema.aiGenerationJobs }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationJobs.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0] || !["QUEUED", "FAILED"].includes(rows[0].job.status) || rows[0].job.attempt >= AI_GENERATION_MAX_RETRY_ATTEMPTS) return null;
      const attempt = rows[0].job.attempt + 1;
      const [job] = await tx.update(schema.aiGenerationJobs).set({ status: "RUNNING", providerId: providerId.trim(), modelId: modelId.trim(), attempt, errorCode: null, updatedAt: now }).where(eq(schema.aiGenerationJobs.id, id)).returning();
      const [attemptRow] = await tx.insert(schema.aiGenerationAttempts).values({ id: randomUUID(), jobId: id, attempt, status: "RUNNING", errorCode: null, createdAt: now }).returning();
      await tx.insert(schema.auditLogs).values(audit("ai.generation.requested", actorId, "ai_generation_job", id, "attempt", String(attempt - 1), String(attempt)));
      return { job: safeJob(job), attempt: safeAttempt(attemptRow) };
    });
  });
}

export async function persistAiGenerationResult(id: string, owner: AiDocumentOwner, result: AiGenerationResult, actorId: string | null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ job: schema.aiGenerationJobs, document: schema.aiDocuments }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationJobs.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      const [job] = await tx.update(schema.aiGenerationJobs).set({ status: result.status, providerId: result.providerId, modelId: result.modelId, qualityGate: result.qualityGate, errorCode: result.errorCode ?? null, outputJson: result.draft ?? null, updatedAt: now }).where(eq(schema.aiGenerationJobs.id, id)).returning();
      await tx.update(schema.aiGenerationAttempts).set({ status: result.status, errorCode: result.errorCode ?? null }).where(and(eq(schema.aiGenerationAttempts.jobId, id), eq(schema.aiGenerationAttempts.attempt, job.attempt)));
      const claims: AiGeneratedClaim[] = [];
      for (const claim of result.claims) {
        validateProvenance(claim.provenance);
        const [row] = await tx.insert(schema.aiGenerationClaims).values({ id: claim.id || randomUUID(), jobId: id, fieldPath: claim.fieldPath.trim(), value: claim.value, sourceFactIds: claim.sourceFactIds, evidenceIds: claim.evidenceIds, confidence: claim.confidence, classification: claim.classification, claimStatus: claim.status, provenance: claim.provenance, createdAt: now }).returning();
        claims.push(safeClaim(row));
      }
      const action = result.status === "SUCCEEDED" ? "ai.generation.completed" : "ai.generation.failed";
      await tx.insert(schema.auditLogs).values(audit(action, actorId, "ai_generation_job", id, "status", "RUNNING", result.status));
      return { job: safeJob(job), claims };
    });
  });
}

export async function listAiGenerationJobs(owner: AiDocumentOwner, options: { page?: number; pageSize?: number } = {}) {
  return withPersistenceError(async () => {
    const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 50);
    const page = Math.max(options.page ?? 1, 1);
    const condition = and(eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId));
    const [rows, totalRows] = await Promise.all([
      getDb().select({ job: schema.aiGenerationJobs }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(condition).orderBy(desc(schema.aiGenerationJobs.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      getDb().select({ count: sql<string>`count(*)` }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(condition),
    ]);
    return { items: rows.map(({ job }) => safeJob(job)), total: Number(totalRows[0]?.count ?? 0), page, pageSize };
  });
}

export async function listAiGenerationClaims(jobId: string, owner: AiDocumentOwner) {
  return withPersistenceError(async () => {
    const rows = await getDb().select({ claim: schema.aiGenerationClaims }).from(schema.aiGenerationClaims).innerJoin(schema.aiGenerationJobs, eq(schema.aiGenerationJobs.id, schema.aiGenerationClaims.jobId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationClaims.jobId, jobId), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).orderBy(desc(schema.aiGenerationClaims.createdAt));
    return rows.map(({ claim }) => safeClaim(claim));
  });
}

export async function retryAiGenerationJob(id: string, owner: AiDocumentOwner, actorId: string | null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ job: schema.aiGenerationJobs, document: schema.aiDocuments }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationJobs.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0] || rows[0].job.status !== "FAILED" || rows[0].job.attempt >= AI_GENERATION_MAX_RETRY_ATTEMPTS) return null;
      const [job] = await tx.update(schema.aiGenerationJobs).set({ status: "QUEUED", qualityGate: "PENDING", errorCode: null, updatedAt: now }).where(eq(schema.aiGenerationJobs.id, id)).returning();
      await tx.insert(schema.auditLogs).values(audit("ai.generation.requested", actorId, "ai_generation_job", id, "retry", String(rows[0].job.attempt), String(rows[0].job.attempt + 1)));
      return safeJob(job);
    });
  });
}

export async function reviewAiGenerationClaim(claimId: string, owner: AiDocumentOwner, reviewerId: string, input: AiGenerationReviewInput) {
  return withPersistenceError(async () => {
    if (!reviewerId.trim()) throw new AiFactValidationError("هوية المراجع مطلوبة");
    const reviewInput = validateGenerationReviewInput(input);
    input = reviewInput;
    if (input.action === "EDIT" && (input.reviewedValue === undefined || input.reviewedValue === null)) throw new AiFactValidationError("القيمة المعدلة مطلوبة");
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ claim: schema.aiGenerationClaims, document: schema.aiDocuments }).from(schema.aiGenerationClaims).innerJoin(schema.aiGenerationJobs, eq(schema.aiGenerationJobs.id, schema.aiGenerationClaims.jobId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationClaims.id, claimId), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      const nextStatus: AiClaimStatus = claimStatusAfterReview(input.action);
      const reviewedValue = input.action === "EDIT" ? input.reviewedValue : input.action === "REJECT" ? rows[0].claim.value : rows[0].claim.value;
      await tx.insert(schema.aiGenerationReviewDecisions).values({ id: randomUUID(), claimId, reviewerId, action: input.action, originalValue: rows[0].claim.value, reviewedValue: reviewedValue ?? null, reviewerNote: input.reviewerNote?.trim() || null, createdAt: now });
      const [claim] = await tx.update(schema.aiGenerationClaims).set({ value: reviewedValue ?? null, claimStatus: nextStatus }).where(eq(schema.aiGenerationClaims.id, claimId)).returning();
      const action: AiAuditAction = input.action === "ACCEPT" ? "ai.review.accepted" : input.action === "EDIT" ? "ai.review.edited" : input.action === "REJECT" ? "ai.review.rejected" : "ai.review.requested";
      await tx.insert(schema.auditLogs).values(audit(action, reviewerId, "ai_generation_claim", claimId, "claim_status", rows[0].claim.claimStatus, nextStatus));
      return { claim: safeClaim(claim), action: input.action };
    });
  });
}

export async function getAdminAiGenerationDocumentDetail(documentId: string) {
  return withPersistenceError(async () => {
    const jobs = await getDb().select({ job: schema.aiGenerationJobs }).from(schema.aiGenerationJobs).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiGenerationJobs.documentId)).where(and(eq(schema.aiGenerationJobs.documentId, documentId), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).orderBy(desc(schema.aiGenerationJobs.createdAt));
    const jobRecords = jobs.map(({ job }) => safeJob(job));
    const claims = jobRecords[0] ? await getDb().select({ claim: schema.aiGenerationClaims }).from(schema.aiGenerationClaims).where(eq(schema.aiGenerationClaims.jobId, jobRecords[0].id)).orderBy(desc(schema.aiGenerationClaims.createdAt)) : [];
    return { jobs: jobRecords, claims: claims.map(({ claim }) => safeClaim(claim)) };
  });
}
