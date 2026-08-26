import type {
  AiGenerationErrorCode,
  AiGenerationRequest,
  AiGenerationResult,
  AiOutputType,
  AiProfileProvider,
  AiProvider,
  AiProviderCapabilities,
  AiProviderRequest,
  AiProviderResponse,
  AiProviderState,
  AiProviderStatus,
} from "./types";

export const AI_PROVIDER_ENV_KEYS = ["A3LAM_AI_PROVIDER_URL", "A3LAM_AI_PROVIDER_TOKEN"] as const;

export const AI_GENERATION_DEFAULT_CAPABILITIES: AiProviderCapabilities = {
  structuredOutput: true,
  maxInputBytes: 8 * 1024 * 1024,
  maxOutputTokens: 2_000,
  timeoutMs: 15_000,
};

export class AiProviderError extends Error {
  readonly code: AiGenerationErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: AiGenerationErrorCode, retryable = false) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}

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
  // This foundation deliberately has no executable provider implementation.
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

export function getAiGenerationProviderStatus(): AiProviderStatus {
  return providerState() === "INVALID_CONFIGURATION" ? "ERROR" : "NOT_CONFIGURED";
}

export const unavailableAiProvider: AiProfileProvider = {
  name: "unconfigured",
  get state() { return providerState(); },
  async run(request: AiProviderRequest): Promise<AiProviderResponse> {
    void request;
    throw new Error("AI provider requires configuration");
  },
};

export const unconfiguredAiGenerationProvider: AiProvider = {
  id: "unconfigured",
  modelId: "unconfigured",
  get status() { return getAiGenerationProviderStatus(); },
  capabilities: AI_GENERATION_DEFAULT_CAPABILITIES,
  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    void request;
    throw new AiProviderError("AI provider requires configuration", "PROVIDER_NOT_CONFIGURED");
  },
};

export function assertProviderStatus(status: AiProviderStatus) {
  if (status !== "READY") throw new AiProviderError("AI provider is not ready", "PROVIDER_NOT_CONFIGURED");
  return status;
}
