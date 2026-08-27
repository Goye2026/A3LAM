export const CMS_EDITORIAL_STATUSES = ["draft", "review", "scheduled", "published", "trashed"] as const;
export type CmsEditorialStatus = (typeof CMS_EDITORIAL_STATUSES)[number];

export const CMS_EDITORIAL_TRANSITIONS: Readonly<Record<CmsEditorialStatus, readonly CmsEditorialStatus[]>> = Object.freeze({
  draft: ["draft", "review", "trashed"],
  review: ["draft", "review", "scheduled", "published", "trashed"],
  scheduled: ["draft", "scheduled", "published", "trashed"],
  published: ["draft", "published", "trashed"],
  trashed: ["draft", "trashed"],
});

export function isCmsEditorialStatus(value: unknown): value is CmsEditorialStatus {
  return typeof value === "string" && (CMS_EDITORIAL_STATUSES as readonly string[]).includes(value);
}

export function canTransitionCmsEditorialStatus(current: CmsEditorialStatus, next: CmsEditorialStatus) {
  return CMS_EDITORIAL_TRANSITIONS[current].includes(next);
}

export function assertCmsEditorialTransition(current: CmsEditorialStatus, next: CmsEditorialStatus) {
  if (!canTransitionCmsEditorialStatus(current, next)) {
    const error = new Error("This editorial status transition is not allowed");
    error.name = "CmsEditorialConflictError";
    throw error;
  }
}

export function isCmsPublicStatus(status: CmsEditorialStatus) {
  return status === "published";
}

export function requiresCmsNoIndex(status: CmsEditorialStatus) {
  return !isCmsPublicStatus(status);
}
