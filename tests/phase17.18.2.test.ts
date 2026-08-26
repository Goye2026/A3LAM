import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getAiQueueProviderState, unavailableProcessingQueue } from "@/lib/ai/queue";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { AI_MAX_RETRY_ATTEMPTS } from "@/lib/ai/persistence";
import { AI_DOCUMENT_STATUSES } from "@/lib/ai/types";
import { getDocumentStorageState, unavailableDocumentStorage } from "@/lib/ai/storage";
import { assertExtractedText, validateAiDocument } from "@/lib/ai/validation";

describe("Phase 17.18.2 AI ingestion pipeline foundation", () => {
  it("uses centralized lifecycle vocabulary and bounded retry", () => {
    expect(AI_DOCUMENT_STATUSES).toContain("READY_FOR_REVIEW");
    expect(AI_DOCUMENT_STATUSES).toContain("EXTRACTION_FAILED");
    expect(AI_DOCUMENT_STATUSES).toContain("REVIEW_REJECTED");
    expect(AI_MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it("validates TXT and derives a SHA-256 checksum without trusting filename alone", async () => {
    const validated = await validateAiDocument(new File(["الاسم\r\n\r\nالمهنة"], "cv.txt", { type: "text/plain" }));
    expect(validated.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(validated.sizeBytes).toBeGreaterThan(0);
  });

  it("rejects empty normalized extraction and strips only non-semantic controls", () => {
    expect(() => assertExtractedText("\u0000\u0007\n\t  ")).toThrow(/فارغ/);
    expect(assertExtractedText(" أ\u0007   ب\r\n\r\n ج ")).toBe("أ ب\n\nج");
  });

  it("maps AI permissions to existing roles with least privilege", () => {
    expect(hasAdminPermission("ADMIN", "ai.documents.read")).toBe(true);
    expect(hasAdminPermission("ADMIN", "ai.documents.create")).toBe(true);
    expect(hasAdminPermission("EDITOR", "ai.documents.read")).toBe(true);
    expect(hasAdminPermission("EDITOR", "ai.review")).toBe(true);
    expect(hasAdminPermission("EDITOR", "ai.documents.create")).toBe(false);
    expect(hasAdminPermission("MODERATOR", "ai.documents.read")).toBe(false);
  });

  it("keeps private storage and queue explicitly unavailable", async () => {
    expect(getDocumentStorageState()).toBe("REQUIRES_CONFIGURATION");
    expect(getAiQueueProviderState()).toBe("REQUIRES_CONFIGURATION");
    await expect(unavailableDocumentStorage.exists("private/key")).rejects.toThrow(/not configured/);
    await expect(unavailableProcessingQueue.enqueue({ id: "job", documentId: "doc", idempotencyKey: "key", attempt: 0, status: "QUEUED", errorCode: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" })).rejects.toThrow(/not configured/);
  });

  it("keeps migration additive and records no execution behavior", () => {
    const manifest = readFileSync("lib/db/migrations/manifest.mjs", "utf8");
    const migration = readFileSync("drizzle/migrations/0008_phase17_18_2_ai_ingestion_review.sql", "utf8");
    expect(manifest).toContain("0008_phase17_18_2_ai_ingestion_review.sql");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS ai_documents");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS ai_review_decisions");
    expect(migration).not.toMatch(/\b(DROP TABLE|TRUNCATE|INSERT INTO people|INSERT INTO profiles)\b/i);
  });
});
