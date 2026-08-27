import type { AiGenerationMode, AiGenerationLanguage } from "./types";

export type AiRateLimitPolicy = {
  uploadPerHourByRole: Readonly<Record<string, number>>;
  extractionJobsPerHour: number;
  generationRequestsPerHour: number;
  maxConcurrentJobs: number;
  maxInputBytes: number;
  maxOutputTokens: number;
  maxRetries: number;
  distributedEnforcement: "REQUIRES_CONFIGURATION" | "AVAILABLE";
};

export type AiCostControlPolicy = {
  maxInputCharacters: number;
  maxOutputTokens: number;
  maxGenerationDurationMs: number;
  maxRetries: number;
  perUserBudgetMinor: number | null;
  perJobBudgetMinor: number | null;
  globalCircuitBreaker: "CLOSED" | "OPEN" | "NOT_CONFIGURED";
  pricingSource: "CONFIGURED" | "REQUIRES_CONFIGURATION";
};

export type AiObservabilityEvent = {
  correlationId: string;
  jobId: string | null;
  documentId: string | null;
  stage: "UPLOAD" | "SCAN" | "QUEUE" | "EXTRACTION" | "GENERATION" | "REVIEW" | "DELETION";
  status: string;
  durationMs: number | null;
  attempt: number | null;
  errorClass: string | null;
};

export const AI_RATE_LIMIT_POLICY: AiRateLimitPolicy = Object.freeze({
  uploadPerHourByRole: { ADMIN: 20, SUPER_ADMIN: 50, EDITOR: 0, MODERATOR: 0 },
  extractionJobsPerHour: 20,
  generationRequestsPerHour: 10,
  maxConcurrentJobs: 2,
  maxInputBytes: 10 * 1024 * 1024,
  maxOutputTokens: 2_000,
  maxRetries: 3,
  distributedEnforcement: "REQUIRES_CONFIGURATION",
});

export const AI_COST_CONTROL_POLICY: AiCostControlPolicy = Object.freeze({
  maxInputCharacters: 8 * 1024 * 1024,
  maxOutputTokens: 2_000,
  maxGenerationDurationMs: 15_000,
  maxRetries: 3,
  perUserBudgetMinor: null,
  perJobBudgetMinor: null,
  globalCircuitBreaker: "NOT_CONFIGURED",
  pricingSource: "REQUIRES_CONFIGURATION",
});

export function getAiOperationsReadiness() {
  return {
    rateLimits: AI_RATE_LIMIT_POLICY,
    costControls: AI_COST_CONTROL_POLICY,
    observability: {
      status: "READY_WITH_LIMITATIONS" as const,
      rawContentLogging: false as const,
      configured: false,
      allowedFields: ["correlationId", "jobId", "documentId", "stage", "status", "durationMs", "attempt", "errorClass"] as const,
    },
  };
}

export type AiProviderSafePayload = {
  normalizedSourceText?: string;
  approvedFacts: ReadonlyArray<{ fieldPath: string; value: unknown; evidenceIds: readonly string[] }>;
  selectedEvidenceIds: readonly string[];
  mode: AiGenerationMode;
  outputLanguage: AiGenerationLanguage;
};

export const AI_PROVIDER_FORBIDDEN_FIELDS = [
  "storageCredentials", "sessionTokens", "cookies", "databaseCredentials", "internalUrls", "rbac", "adminMetadata", "auditInternals", "unrelatedPrivateDocuments", "providerSecrets", "rawDocumentMetadata",
] as const;

export function buildProviderSafePayload(input: AiProviderSafePayload): AiProviderSafePayload {
  return {
    normalizedSourceText: input.normalizedSourceText,
    approvedFacts: input.approvedFacts.map((fact) => ({ fieldPath: fact.fieldPath, value: fact.value, evidenceIds: [...fact.evidenceIds] })),
    selectedEvidenceIds: [...input.selectedEvidenceIds],
    mode: input.mode,
    outputLanguage: input.outputLanguage,
  };
}

export function assertProviderSafePayload(payload: unknown): asserts payload is AiProviderSafePayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Provider payload must be an object");
  const keys = Object.keys(payload as Record<string, unknown>);
  const forbidden = keys.find((key) => (AI_PROVIDER_FORBIDDEN_FIELDS as readonly string[]).includes(key));
  if (forbidden) throw new Error(`Forbidden provider field: ${forbidden}`);
}
