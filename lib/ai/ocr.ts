import type { AiDocumentType } from "./types";

export const AI_OCR_STATUSES = ["TEXT_LAYER_AVAILABLE", "OCR_REQUIRED", "OCR_AVAILABLE", "OCR_UNAVAILABLE", "OCR_FAILED"] as const;
export type AiOcrStatus = (typeof AI_OCR_STATUSES)[number];

export type AiOcrPolicy = {
  maxPages: number;
  maxInputBytes: number;
  timeoutMs: number;
  languages: readonly string[];
  maxRetries: number;
  costControlled: boolean;
};

export type AiOcrResult = {
  status: AiOcrStatus;
  text: string | null;
  pageCount: number | null;
  language: string | null;
  errorClass: string | null;
};

export type AiOcrAdapter = {
  readonly id: string;
  readonly status: AiOcrStatus;
  readonly policy: AiOcrPolicy;
  extract(input: { documentType: AiDocumentType; bytes: Uint8Array }): Promise<AiOcrResult>;
};

export class AiOcrUnavailableError extends Error {
  constructor(message = "OCR is not configured") { super(message); this.name = "AiOcrUnavailableError"; }
}

export const AI_OCR_DEFAULT_POLICY: AiOcrPolicy = Object.freeze({
  maxPages: 100,
  maxInputBytes: 10 * 1024 * 1024,
  timeoutMs: 20_000,
  languages: ["ar", "en"],
  maxRetries: 1,
  costControlled: true,
});

export function getAiOcrStatus(): AiOcrStatus {
  return "OCR_UNAVAILABLE";
}

export const unavailableAiOcrAdapter: AiOcrAdapter = {
  id: "unconfigured",
  status: "OCR_UNAVAILABLE",
  policy: AI_OCR_DEFAULT_POLICY,
  async extract() { throw new AiOcrUnavailableError(); },
};
