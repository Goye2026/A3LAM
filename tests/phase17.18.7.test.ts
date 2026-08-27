import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_FEATURE_GATES, AI_PUBLICATION_ENABLED, getAiFeatureGates } from "@/lib/ai/activation";
import { getAiProviderReadiness } from "@/lib/ai/provider";
import { assertProviderSafePayload, buildProviderSafePayload, AI_COST_CONTROL_POLICY, AI_PROVIDER_FORBIDDEN_FIELDS, AI_RATE_LIMIT_POLICY, getAiOperationsReadiness } from "@/lib/ai/operations";
import { getAiQueueReadiness, AI_QUEUE_DEFAULT_POLICY } from "@/lib/ai/queue";
import { getAiMalwareScannerState, unavailableAiMalwareScanner } from "@/lib/ai/malware";
import { getAiOcrStatus, AI_OCR_DEFAULT_POLICY, unavailableAiOcrAdapter } from "@/lib/ai/ocr";
import { getAiRetentionReadiness } from "@/lib/ai/retention";
import { getDocumentStorageReadiness } from "@/lib/ai/storage";
import { getRepositoryMigrationVersions } from "@/lib/admin/migrationRegistry";

const root = resolve(process.cwd());

describe("Phase 17.18.7 production activation readiness", () => {
  it("keeps every production feature gate OFF, including publication", () => {
    expect(AI_FEATURE_GATES).toEqual({
      AI_UPLOAD_ENABLED: false,
      AI_PROCESSING_ENABLED: false,
      AI_GENERATION_ENABLED: false,
      AI_OCR_ENABLED: false,
      AI_PUBLICATION_ENABLED: false,
    });
    expect(getAiFeatureGates()).toEqual(AI_FEATURE_GATES);
    expect(AI_PUBLICATION_ENABLED).toBe(false);
  });

  it("reports provider state without probing or exposing credentials", () => {
    const readiness = getAiProviderReadiness();
    expect(readiness.allowedForProduction).toBe(false);
    expect(readiness.reachable).toBe("NOT_TESTED");
    expect(readiness.evidence.join(" ")).not.toMatch(/token|secret|bearer|database_url/i);
  });

  it("builds an allowlisted provider payload and rejects forbidden top-level fields", () => {
    const payload = buildProviderSafePayload({
      normalizedSourceText: "synthetic normalized text",
      approvedFacts: [{ fieldPath: "identity.nativeName", value: "مثال", evidenceIds: ["evidence-1"] }],
      selectedEvidenceIds: ["evidence-1"],
      mode: "PROFESSIONAL_PROFILE",
      outputLanguage: "ARABIC",
    });
    expect(Object.keys(payload).sort()).toEqual(["approvedFacts", "mode", "normalizedSourceText", "outputLanguage", "selectedEvidenceIds"]);
    expect(() => assertProviderSafePayload({ ...payload, providerSecrets: "blocked" })).toThrow(/Forbidden provider field/);
    expect(AI_PROVIDER_FORBIDDEN_FIELDS).toContain("rawDocumentMetadata");
  });

  it("keeps storage private-only and does not claim Production provisioning", () => {
    const readiness = getDocumentStorageReadiness();
    expect(readiness.privateByDefault).toBe(true);
    expect(readiness.publicIndexable).toBe(false);
    expect(readiness.publicSearchable).toBe(false);
    expect(readiness.publicSitemapVisible).toBe(false);
    expect(readiness.productionProvisioned).toBe(false);
    expect(readiness.signedRetrieval).toBe("REQUIRES_CONFIGURATION");
  });

  it("blocks processing when malware scanning is unavailable", async () => {
    expect(getAiMalwareScannerState()).toBe("REQUIRES_CONFIGURATION");
    expect(unavailableAiMalwareScanner.available).toBe(false);
    await expect(unavailableAiMalwareScanner.scan({ id: "doc", mimeType: "text/plain", sizeBytes: 1, checksumSha256: "a".repeat(64) })).rejects.toThrow(/scanner/i);
  });

  it("keeps OCR explicit and bounded", async () => {
    expect(getAiOcrStatus()).toBe("OCR_UNAVAILABLE");
    expect(AI_OCR_DEFAULT_POLICY.maxPages).toBe(100);
    expect(AI_OCR_DEFAULT_POLICY.costControlled).toBe(true);
    await expect(unavailableAiOcrAdapter.extract({ documentType: "pdf", bytes: new Uint8Array() })).rejects.toThrow(/OCR/i);
  });

  it("defines queue retry/idempotency/stale-job policy without provisioning a queue", async () => {
    const readiness = getAiQueueReadiness();
    expect(readiness.state).toBe("REQUIRES_CONFIGURATION");
    expect(readiness.worker).toBe("REQUIRES_CONFIGURATION");
    expect(AI_QUEUE_DEFAULT_POLICY.duplicateKey).toBe("idempotencyKey");
    expect(AI_QUEUE_DEFAULT_POLICY.maxRetries).toBe(3);
  });

  it("reports cost controls as configuration-required rather than fake pricing", () => {
    const readiness = getAiOperationsReadiness();
    expect(readiness.costControls.pricingSource).toBe("REQUIRES_CONFIGURATION");
    expect(readiness.costControls.perJobBudgetMinor).toBeNull();
    expect(AI_COST_CONTROL_POLICY.globalCircuitBreaker).toBe("NOT_CONFIGURED");
    expect(AI_RATE_LIMIT_POLICY.distributedEnforcement).toBe("REQUIRES_CONFIGURATION");
    expect(readiness.observability.rawContentLogging).toBe(false);
  });

  it("keeps retention deletion disabled and policy explicit", () => {
    const readiness = getAiRetentionReadiness();
    expect(readiness.status).toBe("REQUIRES_CONFIGURATION");
    expect(readiness.policy.automaticDeletionEnabled).toBe(false);
    expect(readiness.deletionExecuted).toBe(false);
  });

  it("keeps migrations ordered and preflight-only", async () => {
    const versions = getRepositoryMigrationVersions();
    expect(versions.slice(-3)).toEqual([
      "0007_phase17_16_media_architecture.sql",
      "0008_phase17_18_2_ai_ingestion_review.sql",
      "0009_phase17_18_4_ai_generation.sql",
    ]);
    const readinessRoute = await readFile(resolve(root, "app/api/admin/ai/readiness/route.ts"), "utf8");
    expect(readinessRoute).toContain("requirePermissionPrincipal");
    expect(readinessRoute).toContain("getAiProductionReadinessReport");
    expect(readinessRoute).not.toContain("runMigrations");
    expect(readinessRoute).not.toContain("POST");
  });

  it("keeps readiness private, review-controlled, and publication-disabled", async () => {
    const page = await readFile(resolve(root, "app/admin/(protected)/ai/page.tsx"), "utf8");
    const matrix = await readFile(resolve(root, "components/a3lam/ai/A3lamAiReadinessMatrix.tsx"), "utf8");
    const route = await readFile(resolve(root, "app/api/admin/ai/documents/[id]/generation/route.ts"), "utf8");
    const uploadRoute = await readFile(resolve(root, "app/api/admin/ai/documents/route.ts"), "utf8");
    const readinessRoute = await readFile(resolve(root, "app/api/admin/ai/readiness/route.ts"), "utf8");
    expect(page).toContain("A3lamAiReadinessMatrix");
    expect(matrix).toContain("adminAiReadinessEvidence");
    expect(matrix).toContain("adminAiReadinessNextStep");
    expect(matrix).toContain("adminAiReadinessBlocker");
    expect(matrix).toContain("ai-readiness-grid");
    expect(route).toContain("AI_GENERATION_ENABLED");
    expect(uploadRoute).toContain("AI_UPLOAD_ENABLED");
    expect(uploadRoute).toContain("AI_PROCESSING_ENABLED");
    expect(readinessRoute).not.toContain("POST");
    expect(route).toContain("requirePermissionPrincipal");
    expect(route).toContain("isSameOriginMutation");
    expect(page).not.toMatch(/publishPerson|createPerson|publishProfile/);
  });
});
