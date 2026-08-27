/**
 * Production AI activation boundaries.
 *
 * Every gate is deliberately code-defaulted to OFF. Enabling any production
 * capability requires a separately reviewed configuration and activation task.
 * Publication is a hard safety boundary and cannot be enabled by configuration.
 */
import type { AiFeatureGates } from "./types";

export const AI_PRODUCTION_ENABLED = false as const;
export const AI_UPLOAD_ENABLED = false as const;
export const AI_PROCESSING_ENABLED = false as const;
export const AI_GENERATION_ENABLED = false as const;
export const AI_OCR_ENABLED = false as const;
export const AI_PUBLICATION_ENABLED = false as const;

export const AI_FEATURE_GATES: AiFeatureGates = Object.freeze({
  AI_UPLOAD_ENABLED,
  AI_PROCESSING_ENABLED,
  AI_GENERATION_ENABLED,
  AI_OCR_ENABLED,
  AI_PUBLICATION_ENABLED,
});

export type AiActivationState = "DISABLED" | "ENABLED";

export function getAiProductionActivationState(): AiActivationState {
  return AI_PRODUCTION_ENABLED ? "ENABLED" : "DISABLED";
}

export function getAiFeatureGates(): AiFeatureGates {
  return { ...AI_FEATURE_GATES };
}

export function assertAiProductionEnabled(): void {
  if (!AI_PRODUCTION_ENABLED) {
    throw new Error("AI production processing is disabled");
  }
}

export function assertAiFeatureEnabled(gate: keyof AiFeatureGates): void {
  if (!AI_FEATURE_GATES[gate]) {
    throw new Error(`${gate} is disabled`);
  }
}
