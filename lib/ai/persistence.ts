import { and, desc, eq, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { buildAiAuditLogInput } from "./audit";
import { AiFactValidationError, validateProvenance, validateStructuredFact } from "./facts";
import { DocumentExtractionUnavailableError } from "./ingestion";
import { assertExtractedText, type ValidatedAiDocument } from "./validation";
import type { AiAuditAction, AiDocumentRecord, AiDocumentStatus, AiExtractedSourceRecord, AiFactReviewItem, AiFailureCode, AiOwnerType, AiProcessingJobRecord, AiProcessingJobStatus, AiReviewDecision, AiReviewInput, DocumentExtractionResult, StructuredFact } from "./types";

export const AI_DOCUMENT_PAGE_SIZE = 20;
export const AI_MAX_RETRY_ATTEMPTS = 3;

export class AiPersistenceUnavailableError extends Error {
  constructor(message = "AI persistence is not available") { super(message); this.name = "AiPersistenceUnavailableError"; }
}

export class AiDocumentConflictError extends Error {
  constructor(message = "A document with this checksum already exists for this owner") { super(message); this.name = "AiDocumentConflictError"; }
}

export type AiDocumentOwner = { ownerType: AiOwnerType; ownerId: string };
export type AiDocumentListItem = Omit<AiDocumentRecord, "storageKey">;

type DocumentRow = typeof schema.aiDocuments.$inferSelect;

type JobRow = typeof schema.aiProcessingJobs.$inferSelect;

function asIso(value: Date | string) { return value instanceof Date ? value.toISOString() : value; }
function sha256(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }
function assertBoundedJson(value: unknown) {
  let encoded: string;
  try { encoded = JSON.stringify(value); } catch { throw new AiFactValidationError("قيمة المعلومة غير قابلة للحفظ"); }
  if (encoded.length > 100_000) throw new AiFactValidationError("قيمة المعلومة أكبر من الحد المسموح");
}

function missingSchema(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "42P01";
}

function safeDocument(row: DocumentRow): AiDocumentListItem {
  return {
    id: row.id,
    originalFilename: row.originalFilename,
    normalizedFilename: row.normalizedFilename,
    documentType: row.documentType,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    checksumSha256: row.checksumSha256,
    ingestionStatus: row.ingestionStatus,
    extractionStatus: row.extractionStatus,
    processingStatus: row.processingStatus,
    ownerType: row.ownerType,
    ownerId: row.ownerId,
    retentionPolicy: row.retentionPolicy,
    failureCode: row.failureCode,
    createdAt: asIso(row.createdAt),
    updatedAt: asIso(row.updatedAt),
  };
}

function safeJob(row: JobRow): AiProcessingJobRecord {
  return { id: row.id, documentId: row.documentId, idempotencyKey: row.idempotencyKey, attempt: row.attempt, status: row.status, errorCode: row.errorCode, createdAt: asIso(row.createdAt), updatedAt: asIso(row.updatedAt) };
}

function safeFailureCode(error: unknown): AiFailureCode {
  return error instanceof DocumentExtractionUnavailableError ? "EXTRACTION_UNAVAILABLE" : "EXTRACTION_FAILED";
}

function auditRow(action: AiAuditAction, actorId: string | null, entityType: "ai_document" | "ai_extraction" | "ai_fact" | "ai_draft" | "person" | "profile", entityId: string, field: string, oldValue: string | null, newValue: string | null) {
  return buildAiAuditLogInput({ action, actorType: "admin", actorId, entityType, entityId, field, oldValue, newValue, reason: null }, randomUUID());
}

async function withPersistenceError<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) { if (missingSchema(error)) throw new AiPersistenceUnavailableError("AI persistence requires migration"); throw error; }
}

export async function listAiDocuments(owner: AiDocumentOwner, options: { page?: number; pageSize?: number } = {}) {
  return withPersistenceError(async () => {
    const db = getDb();
    const pageSize = Math.min(Math.max(options.pageSize ?? AI_DOCUMENT_PAGE_SIZE, 1), 50);
    const page = Math.max(options.page ?? 1, 1);
    const [rows, totalRows] = await Promise.all([
      db.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).orderBy(desc(schema.aiDocuments.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<string>`count(*)` }).from(schema.aiDocuments).where(and(eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))),
    ]);
    return { items: rows.map(safeDocument), total: Number(totalRows[0]?.count ?? 0), page, pageSize };
  });
}

export async function getAiDocument(id: string, owner: AiDocumentOwner) {
  return withPersistenceError(async () => {
    const rows = await getDb().select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
    return rows[0] ? safeDocument(rows[0]) : null;
  });
}

export async function createAiDocument(input: ValidatedAiDocument, owner: AiDocumentOwner, actorId: string | null, storageKey: string | null = null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const existing = await db.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId), eq(schema.aiDocuments.checksumSha256, input.checksumSha256))).limit(1);
    if (existing[0]) return { duplicate: true as const, document: safeDocument(existing[0]), job: null };
    const documentId = randomUUID();
    const jobId = randomUUID();
    const now = new Date();
    const idempotencyKey = `${owner.ownerType}:${owner.ownerId}:${input.checksumSha256}`;
    const result = await db.transaction(async (tx) => {
      const [document] = await tx.insert(schema.aiDocuments).values({ id: documentId, originalFilename: input.originalName, normalizedFilename: input.originalName, documentType: input.documentType, mimeType: input.mimeType, sizeBytes: input.sizeBytes, checksumSha256: input.checksumSha256, ingestionStatus: "UPLOADED", extractionStatus: "NOT_STARTED", processingStatus: "QUEUED", ownerType: owner.ownerType, ownerId: owner.ownerId, storageKey, retentionPolicy: "REQUIRES_CONFIGURATION", failureCode: null, createdAt: now, updatedAt: now }).returning();
      const [job] = await tx.insert(schema.aiProcessingJobs).values({ id: jobId, documentId, idempotencyKey, attempt: 0, status: "QUEUED", errorCode: null, createdAt: now, updatedAt: now }).returning();
      await tx.insert(schema.auditLogs).values(auditRow("ai.document.submitted", actorId, "ai_document", documentId, "status", null, "UPLOADED"));
      return { document, job };
    });
    return { duplicate: false as const, document: safeDocument(result.document), job: safeJob(result.job) };
  });
}

export async function markAiDocumentValidating(id: string, owner: AiDocumentOwner, actorId: string | null) {
  return transitionDocument(id, owner, "UPLOADED", "VALIDATING", "NOT_STARTED", "QUEUED", null, actorId);
}

export async function markAiDocumentExtracting(id: string, owner: AiDocumentOwner, actorId: string | null) {
  return transitionDocument(id, owner, "VALIDATING", "EXTRACTING", "IN_PROGRESS", "RUNNING", null, actorId, "ai.extraction.started");
}

export async function persistExtraction(id: string, owner: AiDocumentOwner, extraction: DocumentExtractionResult, actorId: string | null) {
  return withPersistenceError(async () => {
    const normalizedText = assertExtractedText(extraction.normalizedText);
    const textSha256 = sha256(normalizedText);
    const textBytes = new TextEncoder().encode(normalizedText).byteLength;
    const db = getDb();
    const now = new Date();
    const sourceId = randomUUID();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      const [source] = await tx.insert(schema.aiExtractedSources).values({ id: sourceId, documentId: id, normalizedText, textSha256, textBytes, extractor: extraction.metadata.extractor, extractionStatus: "SUCCEEDED", createdAt: now }).returning();
      await tx.update(schema.aiDocuments).set({ ingestionStatus: "READY_FOR_REVIEW", extractionStatus: "SUCCEEDED", processingStatus: "SUCCEEDED", failureCode: null, updatedAt: now }).where(eq(schema.aiDocuments.id, id));
      await tx.update(schema.aiProcessingJobs).set({ status: "SUCCEEDED", updatedAt: now }).where(eq(schema.aiProcessingJobs.documentId, id));
      await tx.insert(schema.auditLogs).values(auditRow("ai.extraction.succeeded", actorId, "ai_extraction", sourceId, "status", "EXTRACTING", "READY_FOR_REVIEW"));
      return source;
    });
    if (!result) return null;
    return { source: { id: result.id, documentId: result.documentId, normalizedText: result.normalizedText, extractor: result.extractor, extractionStatus: result.extractionStatus, createdAt: asIso(result.createdAt) } satisfies AiExtractedSourceRecord };
  });
}

export async function markAiExtractionFailed(id: string, owner: AiDocumentOwner, error: unknown, actorId: string | null) {
  return withPersistenceError(async () => {
    const code = safeFailureCode(error);
    const now = new Date();
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      await tx.update(schema.aiDocuments).set({ ingestionStatus: code === "EXTRACTION_UNAVAILABLE" ? "PROCESSING_FAILED" : "EXTRACTION_FAILED", extractionStatus: code === "EXTRACTION_UNAVAILABLE" ? "UNAVAILABLE" : "FAILED", processingStatus: "FAILED", failureCode: code, updatedAt: now }).where(eq(schema.aiDocuments.id, id));
      await tx.update(schema.aiProcessingJobs).set({ status: "FAILED", errorCode: code, updatedAt: now }).where(eq(schema.aiProcessingJobs.documentId, id));
      await tx.insert(schema.auditLogs).values(auditRow("ai.extraction.failed", actorId, "ai_document", id, "failure_code", null, code));
      return true;
    });
    return result ? { id, failureCode: code } : null;
  });
}

async function transitionDocument(id: string, owner: AiDocumentOwner, expected: AiDocumentStatus, next: AiDocumentStatus, extractionStatus: "NOT_STARTED" | "IN_PROGRESS", processingStatus: AiProcessingJobStatus, failureCode: AiFailureCode | null, actorId: string | null, auditAction: "ai.extraction.started" = "ai.extraction.started") {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0] || rows[0].ingestionStatus !== expected) return null;
      const [document] = await tx.update(schema.aiDocuments).set({ ingestionStatus: next, extractionStatus, processingStatus, failureCode, updatedAt: now }).where(eq(schema.aiDocuments.id, id)).returning();
      await tx.update(schema.aiProcessingJobs).set({ status: processingStatus, updatedAt: now }).where(eq(schema.aiProcessingJobs.documentId, id));
      if (auditAction) await tx.insert(schema.auditLogs).values(auditRow(auditAction, actorId, "ai_document", id, "status", expected, next));
      return document;
    });
    return result ? safeDocument(result) : null;
  });
}

export async function beginAiReview(id: string, owner: AiDocumentOwner, actorId: string | null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0] || !["READY_FOR_REVIEW", "REVIEW_IN_PROGRESS"].includes(rows[0].ingestionStatus)) return null;
      if (rows[0].ingestionStatus === "READY_FOR_REVIEW") {
        const [updated] = await tx.update(schema.aiDocuments).set({ ingestionStatus: "REVIEW_IN_PROGRESS", updatedAt: now }).where(eq(schema.aiDocuments.id, id)).returning();
        await tx.insert(schema.auditLogs).values(auditRow("ai.human_review.started", actorId, "ai_document", id, "status", "READY_FOR_REVIEW", "REVIEW_IN_PROGRESS"));
        return updated;
      }
      return rows[0];
    });
    return result ? safeDocument(result) : null;
  });
}

export async function listAiFacts(id: string, owner: AiDocumentOwner) {
  return withPersistenceError(async () => {
    const db = getDb();
    const rows = await db.select({ fact: schema.aiExtractedFacts, evidence: schema.aiFactEvidence, source: schema.aiExtractedSources }).from(schema.aiExtractedFacts).innerJoin(schema.aiFactEvidence, eq(schema.aiFactEvidence.factId, schema.aiExtractedFacts.id)).innerJoin(schema.aiExtractedSources, eq(schema.aiExtractedSources.id, schema.aiExtractedFacts.sourceId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiExtractedSources.documentId)).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).orderBy(desc(schema.aiExtractedFacts.createdAt));
    return rows.map(({ fact, evidence, source }): AiFactReviewItem => ({ id: fact.id, documentId: source.documentId, fieldPath: fact.fieldPath, value: fact.value, confidence: fact.confidence, classification: fact.classification, reviewStatus: fact.reviewStatus, provenance: [{ sourceType: "document", documentId: source.documentId, page: evidence.page ?? undefined, section: evidence.section ?? undefined, excerpt: evidence.excerpt, sourceUrl: evidence.sourceUrl ?? undefined }] }));
  });
}

export async function addAiExtractedFact(input: { sourceId: string; fieldPath: string; fact: StructuredFact; evidence: { page?: number; section?: string; excerpt: string; sourceUrl?: string } }, owner: AiDocumentOwner, actorId: string | null) {
  return withPersistenceError(async () => {
    validateStructuredFact(input.fact);
    assertBoundedJson(input.fact.value);
    if (!input.fieldPath.trim() || input.fieldPath.trim().length > 180) throw new AiFactValidationError("مسار الحقل غير صالح");
    validateProvenance([{ sourceType: "document", excerpt: input.evidence.excerpt, page: input.evidence.page, section: input.evidence.section, sourceUrl: input.evidence.sourceUrl }]);
    const db = getDb();
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select({ source: schema.aiExtractedSources, document: schema.aiDocuments }).from(schema.aiExtractedSources).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiExtractedSources.documentId)).where(and(eq(schema.aiExtractedSources.id, input.sourceId), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      const factId = randomUUID();
      await tx.insert(schema.aiExtractedFacts).values({ id: factId, sourceId: input.sourceId, fieldPath: input.fieldPath.trim(), value: input.fact.value, confidence: input.fact.confidence, classification: input.fact.classification, reviewStatus: "UNREVIEWED", createdAt: now, updatedAt: now });
      await tx.insert(schema.aiFactEvidence).values({ id: randomUUID(), factId, page: input.evidence.page ?? null, section: input.evidence.section?.trim() || null, excerpt: input.evidence.excerpt.trim(), sourceUrl: input.evidence.sourceUrl?.trim() || null, createdAt: now });
      await tx.insert(schema.auditLogs).values(auditRow("ai.draft.created", actorId, "ai_fact", factId, "review_status", null, "UNREVIEWED"));
      return factId;
    });
    return result ? { id: result, reviewStatus: "UNREVIEWED" as const } : null;
  });
}

export async function reviewAiFact(factId: string, owner: AiDocumentOwner, reviewerId: string, input: AiReviewInput) {
  return withPersistenceError(async () => {
    if (!input || typeof input !== "object" || !["ACCEPTED", "EDITED", "REJECTED"].includes(input.decision)) throw new AiFactValidationError("قرار المراجعة غير صالح");
    if (!reviewerId.trim()) throw new AiFactValidationError("هوية المراجع مطلوبة");
    const note = input.reviewerNote?.trim() || null;
    if (note && note.length > 2000) throw new AiFactValidationError("ملاحظة المراجع أطول من الحد المسموح");
    if (input.decision === "EDITED" && (input.reviewedValue === undefined || input.reviewedValue === null)) throw new AiFactValidationError("القيمة المعدلة مطلوبة");
    assertBoundedJson(input.reviewedValue);
    const db = getDb();
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select({ fact: schema.aiExtractedFacts, document: schema.aiDocuments }).from(schema.aiExtractedFacts).innerJoin(schema.aiExtractedSources, eq(schema.aiExtractedSources.id, schema.aiExtractedFacts.sourceId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiExtractedSources.documentId)).where(and(eq(schema.aiExtractedFacts.id, factId), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).limit(1);
      if (!rows[0]) return null;
      const reviewedValue = input.decision === "EDITED" ? input.reviewedValue : rows[0].fact.value;
      await tx.insert(schema.aiReviewDecisions).values({ id: randomUUID(), factId, reviewerId, decision: input.decision, originalValue: rows[0].fact.value, reviewedValue: reviewedValue ?? null, reviewerNote: note, createdAt: now });
      await tx.update(schema.aiExtractedFacts).set({ value: reviewedValue ?? rows[0].fact.value, reviewStatus: input.decision, classification: input.decision === "REJECTED" ? rows[0].fact.classification : "EDITOR_VERIFIED", updatedAt: now }).where(eq(schema.aiExtractedFacts.id, factId));
      const auditAction = input.decision === "REJECTED" ? "ai.fact.rejected" : "ai.fact.verified";
      await tx.insert(schema.auditLogs).values(auditRow(auditAction, reviewerId, "ai_fact", factId, "review_status", rows[0].fact.reviewStatus, input.decision));
      return { id: factId, decision: input.decision };
    });
    return result;
  });
}

export async function retryAiProcessingJob(id: string, owner: AiDocumentOwner, actorId: string | null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select({ document: schema.aiDocuments, job: schema.aiProcessingJobs }).from(schema.aiDocuments).innerJoin(schema.aiProcessingJobs, eq(schema.aiProcessingJobs.documentId, schema.aiDocuments.id)).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, owner.ownerType), eq(schema.aiDocuments.ownerId, owner.ownerId))).orderBy(desc(schema.aiProcessingJobs.createdAt)).limit(1);
      if (!rows[0] || rows[0].job.status !== "FAILED" || rows[0].job.attempt >= AI_MAX_RETRY_ATTEMPTS) return null;
      const [job] = await tx.update(schema.aiProcessingJobs).set({ attempt: rows[0].job.attempt + 1, status: "QUEUED", errorCode: null, updatedAt: now }).where(eq(schema.aiProcessingJobs.id, rows[0].job.id)).returning();
      await tx.update(schema.aiDocuments).set({ ingestionStatus: "UPLOADED", extractionStatus: "NOT_STARTED", processingStatus: "QUEUED", failureCode: null, updatedAt: now }).where(eq(schema.aiDocuments.id, id));
      await tx.insert(schema.auditLogs).values(auditRow("ai.document.submitted", actorId, "ai_document", id, "retry", String(rows[0].job.attempt), String(job.attempt)));
      return safeJob(job);
    });
    return result;
  });
}

export const aiPersistence = { listAiDocuments, getAiDocument, createAiDocument, markAiDocumentValidating, markAiDocumentExtracting, persistExtraction, markAiExtractionFailed, beginAiReview, listAiFacts, addAiExtractedFact, reviewAiFact, retryAiProcessingJob, listAdminAiDocuments, getAdminAiDocument, listAdminAiFacts, beginAdminAiReview, reviewAdminAiFact, getAdminAiDocumentPrivateDetail };

export async function listAdminAiDocuments(options: { page?: number; pageSize?: number } = {}) {
  return withPersistenceError(async () => {
    const db = getDb();
    const pageSize = Math.min(Math.max(options.pageSize ?? AI_DOCUMENT_PAGE_SIZE, 1), 50);
    const page = Math.max(options.page ?? 1, 1);
    const condition = eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY");
    const [rows, totalRows] = await Promise.all([
      db.select().from(schema.aiDocuments).where(condition).orderBy(desc(schema.aiDocuments.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<string>`count(*)` }).from(schema.aiDocuments).where(condition),
    ]);
    return { items: rows.map(safeDocument), total: Number(totalRows[0]?.count ?? 0), page, pageSize };
  });
}

export async function getAdminAiDocument(id: string) {
  return withPersistenceError(async () => {
    const rows = await getDb().select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).limit(1);
    return rows[0] ? safeDocument(rows[0]) : null;
  });
}

export async function listAdminAiFacts(id: string) {
  return withPersistenceError(async () => {
    const rows = await getDb().select({ fact: schema.aiExtractedFacts, evidence: schema.aiFactEvidence, source: schema.aiExtractedSources }).from(schema.aiExtractedFacts).innerJoin(schema.aiFactEvidence, eq(schema.aiFactEvidence.factId, schema.aiExtractedFacts.id)).innerJoin(schema.aiExtractedSources, eq(schema.aiExtractedSources.id, schema.aiExtractedFacts.sourceId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiExtractedSources.documentId)).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).orderBy(desc(schema.aiExtractedFacts.createdAt));
    return rows.map(({ fact, evidence, source }): AiFactReviewItem => ({ id: fact.id, documentId: source.documentId, fieldPath: fact.fieldPath, value: fact.value, confidence: fact.confidence, classification: fact.classification, reviewStatus: fact.reviewStatus, provenance: [{ sourceType: "document", documentId: source.documentId, page: evidence.page ?? undefined, section: evidence.section ?? undefined, excerpt: evidence.excerpt, sourceUrl: evidence.sourceUrl ?? undefined }] }));
  });
}

export async function beginAdminAiReview(id: string, actorId: string | null) {
  return withPersistenceError(async () => {
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).limit(1);
      if (!rows[0] || !["READY_FOR_REVIEW", "REVIEW_IN_PROGRESS"].includes(rows[0].ingestionStatus)) return null;
      if (rows[0].ingestionStatus === "READY_FOR_REVIEW") {
        const [updated] = await tx.update(schema.aiDocuments).set({ ingestionStatus: "REVIEW_IN_PROGRESS", updatedAt: now }).where(eq(schema.aiDocuments.id, id)).returning();
        await tx.insert(schema.auditLogs).values(auditRow("ai.human_review.started", actorId, "ai_document", id, "status", "READY_FOR_REVIEW", "REVIEW_IN_PROGRESS"));
        return safeDocument(updated);
      }
      return safeDocument(rows[0]);
    });
  });
}

export async function reviewAdminAiFact(factId: string, reviewerId: string, input: AiReviewInput) {
  return withPersistenceError(async () => {
    if (!input || typeof input !== "object" || !["ACCEPTED", "EDITED", "REJECTED"].includes(input.decision)) throw new AiFactValidationError("قرار المراجعة غير صالح");
    if (!reviewerId.trim()) throw new AiFactValidationError("هوية المراجع مطلوبة");
    const note = input.reviewerNote?.trim() || null;
    if (note && note.length > 2000) throw new AiFactValidationError("ملاحظة المراجع أطول من الحد المسموح");
    if (input.decision === "EDITED" && (input.reviewedValue === undefined || input.reviewedValue === null)) throw new AiFactValidationError("القيمة المعدلة مطلوبة");
    assertBoundedJson(input.reviewedValue);
    const db = getDb();
    const now = new Date();
    return db.transaction(async (tx) => {
      const rows = await tx.select({ fact: schema.aiExtractedFacts, document: schema.aiDocuments }).from(schema.aiExtractedFacts).innerJoin(schema.aiExtractedSources, eq(schema.aiExtractedSources.id, schema.aiExtractedFacts.sourceId)).innerJoin(schema.aiDocuments, eq(schema.aiDocuments.id, schema.aiExtractedSources.documentId)).where(and(eq(schema.aiExtractedFacts.id, factId), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).limit(1);
      if (!rows[0]) return null;
      const reviewedValue = input.decision === "EDITED" ? input.reviewedValue : rows[0].fact.value;
      await tx.insert(schema.aiReviewDecisions).values({ id: randomUUID(), factId, reviewerId, decision: input.decision, originalValue: rows[0].fact.value, reviewedValue: reviewedValue ?? null, reviewerNote: note, createdAt: now });
      await tx.update(schema.aiExtractedFacts).set({ value: reviewedValue ?? rows[0].fact.value, reviewStatus: input.decision, classification: input.decision === "REJECTED" ? rows[0].fact.classification : "EDITOR_VERIFIED", updatedAt: now }).where(eq(schema.aiExtractedFacts.id, factId));
      await tx.insert(schema.auditLogs).values(auditRow(input.decision === "REJECTED" ? "ai.fact.rejected" : "ai.fact.verified", reviewerId, "ai_fact", factId, "review_status", rows[0].fact.reviewStatus, input.decision));
      return { id: factId, decision: input.decision as AiReviewDecision };
    });
  });
}

export async function getAdminAiDocumentPrivateDetail(id: string) {
  return withPersistenceError(async () => {
    const db = getDb();
    const documentRows = await db.select().from(schema.aiDocuments).where(and(eq(schema.aiDocuments.id, id), eq(schema.aiDocuments.ownerType, "ADMIN_IDENTITY"))).limit(1);
    if (!documentRows[0]) return null;
    const sources = await db.select({ id: schema.aiExtractedSources.id, documentId: schema.aiExtractedSources.documentId, normalizedText: schema.aiExtractedSources.normalizedText, extractor: schema.aiExtractedSources.extractor, extractionStatus: schema.aiExtractedSources.extractionStatus, createdAt: schema.aiExtractedSources.createdAt }).from(schema.aiExtractedSources).where(eq(schema.aiExtractedSources.documentId, id)).orderBy(desc(schema.aiExtractedSources.createdAt));
    return { document: safeDocument(documentRows[0]), sources: sources.map((source) => ({ ...source, createdAt: asIso(source.createdAt) })) };
  });
}
