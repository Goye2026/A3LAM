export type AiRetentionPolicy = {
  originalDocument: "REQUIRES_CONFIGURATION" | "DEFINED";
  extractedText: "REQUIRES_CONFIGURATION" | "DEFINED";
  facts: "REQUIRES_CONFIGURATION" | "DEFINED";
  generationOutput: "REQUIRES_CONFIGURATION" | "DEFINED";
  evidence: "REQUIRES_CONFIGURATION" | "DEFINED";
  deletionCascade: "REQUIRES_CONFIGURATION" | "DEFINED";
  userRequestedDeletion: "REQUIRES_CONFIGURATION" | "DEFINED";
  administrativeDeletion: "REQUIRES_CONFIGURATION" | "DEFINED";
  failedJobCleanup: "REQUIRES_CONFIGURATION" | "DEFINED";
  orphanCleanup: "REQUIRES_CONFIGURATION" | "DEFINED";
  automaticDeletionEnabled: false;
};

export const AI_RETENTION_POLICY: AiRetentionPolicy = Object.freeze({
  originalDocument: "REQUIRES_CONFIGURATION",
  extractedText: "REQUIRES_CONFIGURATION",
  facts: "REQUIRES_CONFIGURATION",
  generationOutput: "REQUIRES_CONFIGURATION",
  evidence: "REQUIRES_CONFIGURATION",
  deletionCascade: "REQUIRES_CONFIGURATION",
  userRequestedDeletion: "REQUIRES_CONFIGURATION",
  administrativeDeletion: "REQUIRES_CONFIGURATION",
  failedJobCleanup: "REQUIRES_CONFIGURATION",
  orphanCleanup: "REQUIRES_CONFIGURATION",
  automaticDeletionEnabled: false,
});

export function getAiRetentionReadiness() {
  return {
    status: "REQUIRES_CONFIGURATION" as const,
    policy: AI_RETENTION_POLICY,
    deletionExecuted: false as const,
  };
}
