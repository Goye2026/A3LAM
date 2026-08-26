import type { AiProfileProvider, AiProviderRequest, AiProviderResponse, AiProviderState, AiOutputType } from "./types";

export const AI_PROVIDER_ENV_KEYS = ["A3LAM_AI_PROVIDER_URL", "A3LAM_AI_PROVIDER_TOKEN"] as const;

function providerState(): AiProviderState {
  const endpoint = process.env.A3LAM_AI_PROVIDER_URL?.trim();
  const token = process.env.A3LAM_AI_PROVIDER_TOKEN?.trim();
  if (!endpoint || !token) return "REQUIRES_CONFIGURATION";
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return "INVALID_CONFIGURATION";
  } catch {
    return "INVALID_CONFIGURATION";
  }
  // The foundation deliberately has no executable provider implementation.
  return "REQUIRES_CONFIGURATION";
}

export function getAiProviderState() {
  return providerState();
}

export function getAiProviderStatusLabel(state: AiProviderState) {
  return state === "CONFIGURED" ? "CONFIGURED" : state === "INVALID_CONFIGURATION" ? "INVALID_CONFIGURATION" : "REQUIRES_CONFIGURATION";
}

export function getAiProviderOperations(): readonly { operation: AiProviderRequest["operation"]; outputType: AiOutputType }[] {
  return [
    { operation: "extractProfile", outputType: "DATA_EXTRACTION" },
    { operation: "improveProfile", outputType: "PROFILE_IMPROVEMENT" },
    { operation: "generateBiography", outputType: "PROFESSIONAL_BIO" },
    { operation: "generateCV", outputType: "CV" },
    { operation: "generateSEO", outputType: "SEO_ENHANCEMENT" },
  ];
}

export const unavailableAiProvider: AiProfileProvider = {
  name: "unconfigured",
  get state() { return providerState(); },
  async run(request: AiProviderRequest): Promise<AiProviderResponse> {
    void request;
    throw new Error("AI provider requires configuration");
  },
};
