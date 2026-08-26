/**
 * Production AI activation boundary.
 *
 * This is deliberately code-defaulted to OFF. Enabling production processing
 * requires a separately reviewed implementation and environment policy change;
 * no route may infer activation from provider configuration alone.
 */
export const AI_PRODUCTION_ENABLED = false as const;

export type AiActivationState = "DISABLED" | "ENABLED";

export function getAiProductionActivationState(): AiActivationState {
  return AI_PRODUCTION_ENABLED ? "ENABLED" : "DISABLED";
}

export function assertAiProductionEnabled(): void {
  if (!AI_PRODUCTION_ENABLED) {
    throw new Error("AI production processing is disabled");
  }
}
