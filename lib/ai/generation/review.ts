import { AiFactValidationError } from "../facts";
import { AI_REVIEW_DECISION_ACTIONS, type AiClaimStatus, type AiGenerationReviewInput } from "../types";

export function validateGenerationReviewInput(value: unknown): AiGenerationReviewInput {
  if (!value || typeof value !== "object") throw new AiFactValidationError("إجراء المراجعة غير صالح");
  const input = value as Partial<AiGenerationReviewInput>;
  if (!AI_REVIEW_DECISION_ACTIONS.includes(input.action as (typeof AI_REVIEW_DECISION_ACTIONS)[number])) throw new AiFactValidationError("إجراء المراجعة غير صالح");
  if (input.action === "EDIT" && (input.reviewedValue === undefined || input.reviewedValue === null)) throw new AiFactValidationError("القيمة المعدلة مطلوبة");
  if (typeof input.reviewerNote === "string" && input.reviewerNote.length > 2_000) throw new AiFactValidationError("ملاحظة المراجع أطول من الحد المسموح");
  return { action: input.action as AiGenerationReviewInput["action"], reviewedValue: input.reviewedValue, reviewerNote: input.reviewerNote?.trim() || undefined };
}

export function claimStatusAfterReview(action: AiGenerationReviewInput["action"]): AiClaimStatus {
  if (action === "REJECT") return "REJECTED";
  if (action === "REQUEST_SOURCE") return "NEEDS_VERIFICATION";
  return "VERIFIED";
}
