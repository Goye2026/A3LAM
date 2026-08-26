import { getSafePublicUrl } from "@/lib/media/public";
import type { ConfidenceClassification, DocumentProvenance, FactClassification, StructuredFact } from "./types";

export const MAX_PROVENANCE_EXCERPT_LENGTH = 500;

export class AiFactValidationError extends Error {
  constructor(message: string) { super(message); this.name = "AiFactValidationError"; }
}

const CONFIDENCES: readonly ConfidenceClassification[] = ["high", "medium", "low", "unknown"];
const CLASSIFICATIONS: readonly FactClassification[] = ["EXTRACTED", "USER_PROVIDED", "EDITOR_VERIFIED", "AI_INFERRED", "NEEDS_VERIFICATION"];

export function validateProvenance(provenance: DocumentProvenance[]) {
  if (!Array.isArray(provenance) || provenance.length === 0) throw new AiFactValidationError("كل معلومة منظمة تحتاج مصدرًا أو provenance");
  for (const item of provenance) {
    if (!item || typeof item !== "object" || !item.sourceType) throw new AiFactValidationError("نوع provenance غير صالح");
    if (item.excerpt && item.excerpt.length > MAX_PROVENANCE_EXCERPT_LENGTH) throw new AiFactValidationError("مقتطف المصدر أطول من الحد المسموح");
    if (item.page !== undefined && (!Number.isInteger(item.page) || item.page < 1)) throw new AiFactValidationError("رقم صفحة المصدر غير صالح");
    if (item.sourceUrl && !getSafePublicUrl(item.sourceUrl)) throw new AiFactValidationError("رابط المصدر غير آمن");
  }
  return true;
}

export function validateStructuredFact<T>(fact: StructuredFact<T>) {
  if (!fact || typeof fact !== "object") throw new AiFactValidationError("المعلومة المنظمة غير صالحة");
  if (fact.value === null || fact.value === undefined || (typeof fact.value === "string" && !fact.value.trim())) throw new AiFactValidationError("قيمة المعلومة مطلوبة");
  if (!CONFIDENCES.includes(fact.confidence)) throw new AiFactValidationError("تصنيف الثقة غير صالح");
  if (!CLASSIFICATIONS.includes(fact.classification)) throw new AiFactValidationError("تصنيف المعلومة غير صالح");
  validateProvenance(fact.provenance);
  return fact;
}

export function createStructuredFact<T>(value: T, provenance: DocumentProvenance[], confidence: ConfidenceClassification = "unknown", classification: FactClassification = "NEEDS_VERIFICATION"): StructuredFact<T> {
  const fact = { value, provenance, confidence, classification };
  return validateStructuredFact(fact);
}
