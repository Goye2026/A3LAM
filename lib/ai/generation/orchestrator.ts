import type { AiGenerationInput, AiGenerationLanguage, AiGenerationMode, AiGenerationRequest, AiGenerationResult, AiProvider } from "../types";
import { AiProviderError, unconfiguredAiGenerationProvider } from "../provider";
import { buildGenerationPrompt } from "./prompt";
import { evaluateQualityGate, validateGenerationInput } from "./validation";

function configuredResult(request: AiGenerationRequest, provider: AiProvider): AiGenerationResult {
  return {
    status: "REQUIRES_CONFIGURATION",
    draftStatus: "DRAFT",
    mode: request.mode,
    outputLanguage: request.outputLanguage,
    providerId: provider.id,
    modelId: provider.modelId,
    claims: [],
    qualityGate: "PENDING",
    errorCode: "PROVIDER_NOT_CONFIGURED",
    errorMessage: "AI provider requires configuration",
  };
}

function safeProviderMessage(code: AiGenerationResult["errorCode"]) {
  if (code === "PROVIDER_TIMEOUT") return "AI provider timed out";
  if (code === "PROVIDER_RATE_LIMITED") return "AI provider is rate limited";
  if (code === "PROVIDER_NOT_CONFIGURED") return "AI provider requires configuration";
  if (code === "INVALID_OUTPUT") return "Generation output is invalid";
  if (code === "PAYLOAD_TOO_LARGE") return "Generation payload is too large";
  if (code === "PRIVACY_BLOCKED") return "Generation output was blocked by privacy policy";
  return "AI provider is unavailable";
}

function failedResult(request: AiGenerationRequest, provider: AiProvider, error: unknown): AiGenerationResult {
  const providerError = error instanceof AiProviderError ? error : new AiProviderError("AI provider unavailable", "PROVIDER_UNAVAILABLE", true);
  return {
    status: "FAILED",
    draftStatus: "DRAFT",
    mode: request.mode,
    outputLanguage: request.outputLanguage,
    providerId: provider.id,
    modelId: provider.modelId,
    claims: [],
    qualityGate: "REJECTED",
    errorCode: providerError.code,
    errorMessage: safeProviderMessage(providerError.code),
  };
}

export function createGenerationRequest(jobId: string, mode: AiGenerationMode, outputLanguage: AiGenerationLanguage, input: AiGenerationInput): AiGenerationRequest {
  validateGenerationInput(input);
  return { jobId, mode, outputLanguage, input, prompt: buildGenerationPrompt(input, mode, outputLanguage) };
}

export async function runGeneration(request: AiGenerationRequest, provider: AiProvider = unconfiguredAiGenerationProvider): Promise<AiGenerationResult> {
  validateGenerationInput(request.input);
  if (provider.status !== "READY") return configuredResult(request, provider);
  if (!provider.capabilities.structuredOutput) return failedResult(request, provider, new AiProviderError("Structured output is required", "INVALID_OUTPUT"));
  if (request.prompt.messages.reduce((total, message) => total + new TextEncoder().encode(message.content).byteLength, 0) > provider.capabilities.maxInputBytes) return failedResult(request, provider, new AiProviderError("Generation payload too large", "PAYLOAD_TOO_LARGE"));

  let result: AiGenerationResult;
  try {
    result = await Promise.race([
      provider.generate(request),
      new Promise<AiGenerationResult>((_, reject) => setTimeout(() => reject(new AiProviderError("AI provider timeout", "PROVIDER_TIMEOUT", true)), provider.capabilities.timeoutMs)),
    ]);
  } catch (error) {
    return failedResult(request, provider, error);
  }
  if (result.status !== "SUCCEEDED") return { ...result, draftStatus: "DRAFT", claims: result.claims ?? [], qualityGate: result.qualityGate ?? "REJECTED" };
  if (!result.draft) return failedResult(request, provider, new AiProviderError("Structured output is missing", "INVALID_OUTPUT"));
  const gate = evaluateQualityGate(result, request);
  return { ...result, status: "SUCCEEDED", draftStatus: "DRAFT", claims: result.draft.claims, qualityGate: gate.status, errorCode: gate.errorCode, errorMessage: gate.errorCode ? "المخرجات تحتاج مراجعة أو لم تجتز بوابة الجودة" : undefined };
}

export const aiGenerationOrchestrator = { createGenerationRequest, runGeneration };
