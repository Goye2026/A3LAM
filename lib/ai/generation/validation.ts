import { AI_CLAIM_STATUSES, AI_GENERATION_LANGUAGES, AI_GENERATION_MODES } from "../types";
import type { AiGeneratedClaim, AiGeneratedProfileDraft, AiGenerationInput, AiGenerationRequest, AiGenerationResult, AiQualityGateStatus, AiGenerationErrorCode, ConfidenceClassification, FactClassification } from "../types";

export class AiGenerationValidationError extends Error {
  readonly code: AiGenerationErrorCode;

  constructor(message: string, code: AiGenerationErrorCode = "VALIDATION_FAILED") {
    super(message);
    this.name = "AiGenerationValidationError";
    this.code = code;
  }
}

const CONFIDENCE: readonly ConfidenceClassification[] = ["high", "medium", "low", "unknown"];
const CLASSIFICATION: readonly FactClassification[] = ["EXTRACTED", "USER_PROVIDED", "EDITOR_VERIFIED", "AI_INFERRED", "NEEDS_VERIFICATION"];
const SECRET_LIKE = /(?:sk-[a-z0-9]{16,}|bearer\s+[a-z0-9._-]{16,}|api[_ -]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|token\s*[:=])/iu;
const INSTRUCTION_LIKE = /ignore\s+(?:all\s+)?previous\s+instructions|reveal\s+(?:the\s+)?system\s+prompt|call\s+an\s+external\s+tool|publish\s+this\s+profile|تجاهل\s+(?:كل\s+)?التعليمات|كشف\s+(?:تعليمات\s+النظام|الموجه)|انشر\s+هذا\s+الملف/iu;
const URL = /^https?:\/\/[^\s]+$/iu;

function jsonSize(value: unknown) {
  try { return new TextEncoder().encode(JSON.stringify(value)).byteLength; } catch { return Number.POSITIVE_INFINITY; }
}

function assertBounded(value: unknown, label: string, maxBytes: number) {
  if (jsonSize(value) > maxBytes) throw new AiGenerationValidationError(`${label} يتجاوز الحد`, "PAYLOAD_TOO_LARGE");
}

function assertProvenance(claim: AiGeneratedClaim) {
  if (claim.status === "MISSING") return;
  if (!claim.sourceFactIds.length || !claim.evidenceIds.length || !claim.provenance.length) throw new AiGenerationValidationError("كل claim غير المفقود يحتاج source fact وevidence وprovenance", "REVIEW_REQUIRED");
  for (const item of claim.provenance) {
    if (item.excerpt && item.excerpt.length > 500) throw new AiGenerationValidationError("evidence أطول من الحد", "VALIDATION_FAILED");
    if (item.sourceUrl && !URL.test(item.sourceUrl)) throw new AiGenerationValidationError("رابط provenance غير صالح", "VALIDATION_FAILED");
  }
}

export function validateGenerationInput(input: AiGenerationInput) {
  if (!input.documentId.trim()) throw new AiGenerationValidationError("معرف المستند مطلوب");
  if (!Array.isArray(input.facts) || input.facts.length > 500) throw new AiGenerationValidationError("عدد facts يتجاوز الحد", "PAYLOAD_TOO_LARGE");
  assertBounded(input, "generation input", 8 * 1024 * 1024);
  for (const fact of input.facts) {
    if (!fact.id.trim() || !fact.fieldPath.trim()) throw new AiGenerationValidationError("source fact غير صالح");
    if (!Array.isArray(fact.evidenceIds) || fact.evidenceIds.length > 100) throw new AiGenerationValidationError("evidence ids غير صالحة");
    if (!CONFIDENCE.includes(fact.confidence)) throw new AiGenerationValidationError("confidence غير صالحة");
    if (!fact.provenance.length) throw new AiGenerationValidationError("source fact بلا provenance", "REVIEW_REQUIRED");
    assertBounded(fact.value, "fact value", 100_000);
  }
  return input;
}

export function detectSourceConflicts(input: AiGenerationInput) {
  const byField = new Map<string, string>();
  const conflicts = new Set<string>();
  for (const fact of input.facts) {
    const normalized = JSON.stringify(fact.value);
    const previous = byField.get(fact.fieldPath);
    if (previous !== undefined && previous !== normalized) conflicts.add(fact.fieldPath);
    else byField.set(fact.fieldPath, normalized);
  }
  return conflicts;
}

function flattenDraftValues(draft: AiGeneratedProfileDraft) {
  return JSON.stringify(draft);
}

function validateDraftFacts(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if ("value" in value && "provenance" in value && "confidence" in value && "classification" in value) {
    const fact = value as { value: unknown; provenance: AiGeneratedClaim["provenance"]; confidence: ConfidenceClassification; classification: FactClassification };
    if (fact.value === null || fact.value === undefined) throw new AiGenerationValidationError("قيمة structured fact مطلوبة", "INVALID_OUTPUT");
    if (!CONFIDENCE.includes(fact.confidence) || !CLASSIFICATION.includes(fact.classification)) throw new AiGenerationValidationError("تصنيف structured fact غير صالح", "INVALID_OUTPUT");
    if (!Array.isArray(fact.provenance) || fact.provenance.length === 0) throw new AiGenerationValidationError("structured fact بلا provenance", "REVIEW_REQUIRED");
    for (const item of fact.provenance) {
      if (item.excerpt && item.excerpt.length > 500) throw new AiGenerationValidationError("evidence أطول من الحد", "VALIDATION_FAILED");
      if (item.sourceUrl && !URL.test(item.sourceUrl)) throw new AiGenerationValidationError("رابط provenance غير صالح", "VALIDATION_FAILED");
    }
    return;
  }
  if (Array.isArray(value)) { value.forEach(validateDraftFacts); return; }
  Object.values(value).forEach(validateDraftFacts);
}

export function validateGeneratedClaim(claim: AiGeneratedClaim, input: AiGenerationInput, conflicts: Set<string>) {
  if (!claim.id.trim() || !claim.fieldPath.trim()) throw new AiGenerationValidationError("claim غير صالح");
  if (!Array.isArray(claim.sourceFactIds) || !Array.isArray(claim.evidenceIds) || claim.sourceFactIds.length > 100 || claim.evidenceIds.length > 100) throw new AiGenerationValidationError("روابط claim غير صالحة", "PAYLOAD_TOO_LARGE");
  if (!CONFIDENCE.includes(claim.confidence) || !CLASSIFICATION.includes(claim.classification) || !AI_CLAIM_STATUSES.includes(claim.status)) throw new AiGenerationValidationError("تصنيف claim غير صالح");
  if (claim.status !== "MISSING" && (claim.value === null || claim.value === undefined)) throw new AiGenerationValidationError("قيمة claim مطلوبة", "INVALID_OUTPUT");
  if (claim.status === "VERIFIED") throw new AiGenerationValidationError("AI لا يستطيع اعتماد claim تلقائيًا", "REVIEW_REQUIRED");
  assertProvenance(claim);
  const factIds = new Set(input.facts.map((fact) => fact.id));
  if (claim.sourceFactIds.some((id) => !factIds.has(id))) throw new AiGenerationValidationError("claim يشير إلى source fact غير موجود", "INVALID_OUTPUT");
  const evidenceIds = new Set(input.facts.flatMap((fact) => fact.evidenceIds));
  if (claim.evidenceIds.some((id) => !evidenceIds.has(id))) throw new AiGenerationValidationError("claim يشير إلى evidence غير موجود", "INVALID_OUTPUT");
  if (conflicts.has(claim.fieldPath) && claim.status !== "CONFLICTED") throw new AiGenerationValidationError("claim لم يعلن تعارض source facts", "SOURCE_CONFLICT");
  if (SECRET_LIKE.test(JSON.stringify(claim.value)) || INSTRUCTION_LIKE.test(JSON.stringify(claim.value))) throw new AiGenerationValidationError("claim يحتوي قيمة غير آمنة", "PRIVACY_BLOCKED");
  if (typeof claim.value === "string" && claim.value.startsWith("http") && !claim.provenance.some((item) => item.sourceUrl === claim.value)) throw new AiGenerationValidationError("الرابط الناتج غير موجود في provenance", "INVALID_OUTPUT");
  return claim;
}

export function validateGeneratedDraft(draft: AiGeneratedProfileDraft, request: AiGenerationRequest) {
  if (!draft || typeof draft !== "object" || !AI_GENERATION_MODES.includes(draft.mode) || !AI_GENERATION_LANGUAGES.includes(draft.outputLanguage)) throw new AiGenerationValidationError("بنية draft غير صالحة", "INVALID_OUTPUT");
  if (draft.mode !== request.mode || draft.outputLanguage !== request.outputLanguage) throw new AiGenerationValidationError("mode أو output language لا يطابق الطلب", "INVALID_OUTPUT");
  if (!draft.identity || typeof draft.identity !== "object" || !Array.isArray(draft.education) || !Array.isArray(draft.experience) || !Array.isArray(draft.positions) || !Array.isArray(draft.achievements) || !Array.isArray(draft.skills) || !Array.isArray(draft.languages) || !Array.isArray(draft.locations) || !Array.isArray(draft.organizations) || !Array.isArray(draft.publications) || !Array.isArray(draft.awards) || !Array.isArray(draft.webLinks) || !Array.isArray(draft.sources)) throw new AiGenerationValidationError("بنية draft غير صالحة", "INVALID_OUTPUT");
  if ([draft.education, draft.experience, draft.positions, draft.achievements, draft.skills, draft.languages, draft.locations, draft.organizations, draft.publications, draft.awards, draft.webLinks, draft.sources].some((items) => items.length > 500)) throw new AiGenerationValidationError("draft يتجاوز الحد", "PAYLOAD_TOO_LARGE");
  if (!Array.isArray(draft.claims) || draft.claims.length > 500) throw new AiGenerationValidationError("claims غير صالحة", "INVALID_OUTPUT");
  assertBounded(draft, "generated draft", 500_000);
  const conflicts = detectSourceConflicts(request.input);
  const { claims, ...draftFacts } = draft;
  validateDraftFacts(draftFacts);
  claims.forEach((claim) => validateGeneratedClaim(claim, request.input, conflicts));
  if (SECRET_LIKE.test(flattenDraftValues(draft)) || INSTRUCTION_LIKE.test(flattenDraftValues(draft))) throw new AiGenerationValidationError("المسودة تحتوي محتوى غير آمن", "PRIVACY_BLOCKED");
  return draft;
}

export function evaluateQualityGate(result: AiGenerationResult, request: AiGenerationRequest): { status: AiQualityGateStatus; errorCode?: AiGenerationErrorCode } {
  if (!result.draft || result.status !== "SUCCEEDED") return { status: "REJECTED", errorCode: result.errorCode ?? "INVALID_OUTPUT" };
  try {
    validateGeneratedDraft(result.draft, request);
  } catch (error) {
    if (error instanceof AiGenerationValidationError) return { status: error.code === "SOURCE_CONFLICT" || error.code === "REVIEW_REQUIRED" ? "PASS_WITH_REVIEW" : "REJECTED", errorCode: error.code };
    return { status: "REJECTED", errorCode: "INVALID_OUTPUT" };
  }
  return { status: "PASS_WITH_REVIEW" };
}
