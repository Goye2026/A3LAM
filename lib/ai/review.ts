import type { AiDraftStatus, AiReviewAction, AiReviewState, HumanReviewFact, HumanReviewWorkspace, StructuredProfileDraft } from "./types";

export const DEFAULT_REVIEW_ACTIONS: readonly AiReviewAction[] = ["ACCEPT", "EDIT", "REJECT", "MARK_VERIFIED", "MARK_FOR_VERIFICATION"];

export function flattenStructuredProfileFacts(draft: StructuredProfileDraft): HumanReviewFact[] {
  const facts: HumanReviewFact[] = [];
  const visit = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    if ("value" in value && "provenance" in value && "confidence" in value && "classification" in value) {
      const fact = value as { value: unknown; provenance: HumanReviewFact["provenance"]; confidence: HumanReviewFact["confidence"]; classification: HumanReviewFact["classification"] };
      facts.push({ id: `fact-${facts.length + 1}`, fieldPath: path, value: fact.value, provenance: fact.provenance, confidence: fact.confidence, classification: fact.classification, allowedActions: [...DEFAULT_REVIEW_ACTIONS] });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, path ? `${path}.${key}` : key);
  };
  visit(draft, "");
  return facts;
}

export function createHumanReviewWorkspace(draft: StructuredProfileDraft, state: AiReviewState = "NOT_STARTED"): HumanReviewWorkspace {
  const draftStatus: AiDraftStatus = "DRAFT";
  return { state, draftStatus, facts: flattenStructuredProfileFacts(draft) };
}

export function assertAiDraftBoundary(status: AiDraftStatus) {
  if (status !== "DRAFT" && status !== "REVIEW" && status !== "PUBLISHED") throw new Error("حالة المسودة غير صالحة");
  return status;
}
