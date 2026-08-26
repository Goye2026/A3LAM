import { getSafePublicImageUrl } from "@/lib/media/public";
import {
  type PersonRecord,
  type ValidationIssue,
  validateCategory,
  validateEducation,
  validatePerson,
  validatePublishedRecord,
  validateSource,
  validateTimelineEvent,
} from "@/lib/domain/a3lam";

export const LAUNCH_STATUS_CODES = [
  "READY",
  "READY_WITH_LIMITATIONS",
  "REQUIRES_CONFIGURATION",
  "NOT_TESTED",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const;
export type LaunchStatus = (typeof LAUNCH_STATUS_CODES)[number];

export const READINESS_MODES = ["AUTOMATIC", "MANUAL", "EXTERNAL"] as const;
export type ReadinessMode = (typeof READINESS_MODES)[number];

export const LAUNCH_DOMAIN_CODES = [
  "application",
  "database",
  "migrations",
  "authentication",
  "rbac",
  "editorial",
  "media",
  "seo",
  "site_experience",
  "operations",
  "portability",
  "android",
  "domain",
] as const;
export type LaunchDomainCode = (typeof LAUNCH_DOMAIN_CODES)[number];

export type LaunchReadinessItem = {
  id: string;
  domain: LaunchDomainCode;
  label: string;
  status: LaunchStatus;
  mode: ReadinessMode;
  evidence: string;
  owner: string;
  href?: string;
};

export type PersonReadinessState = "READY_FOR_REVIEW" | "READY_FOR_PUBLICATION" | "INCOMPLETE" | "BLOCKED";

export type PersonReadinessResult = {
  state: PersonReadinessState;
  lifecycle: PersonRecord["person"]["status"];
  required: { completed: number; total: number; missing: string[] };
  recommended: { completed: number; total: number; missing: string[] };
  sourceCount: number;
  validSourceCount: number;
  media: "PRESENT" | "MISSING_RECOMMENDED" | "INVALID";
  issues: ValidationIssue[];
};

const requiredFieldLabels = [
  ["name", "name"],
  ["nameArabic", "nameArabic"],
  ["slug", "slug"],
  ["shortBio", "shortBio"],
  ["biography", "biography"],
  ["categoryIds", "category"],
] as const;

function isNonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function requiredMissing(record: PersonRecord) {
  const person = record.person;
  const missing: string[] = requiredFieldLabels
    .filter(([field]) => {
      if (field === "categoryIds") return person.categoryIds.length === 0;
      return !isNonEmpty(person[field]);
    })
    .map(([, label]) => label);
  if (person.occupations.length === 0 || person.occupations.some((occupation) => !isNonEmpty(occupation))) missing.push("occupations");
  return [...new Set(missing)];
}

function recommendedMissing(record: PersonRecord, mediaUrl: string | null | undefined) {
  const missing: string[] = [];
  if (!getSafePublicImageUrl(mediaUrl)) missing.push("portrait");
  if (record.sources.length === 0) missing.push("sources");
  if (record.sources.length > 0 && record.sources.some((source) => !isValidHttpUrl(source.url))) missing.push("valid source URL");
  if (!isNonEmpty(record.person.shortBio)) missing.push("seo description");
  if (record.timeline.length === 0 && record.education.length === 0) missing.push("structured metadata");
  return [...new Set(missing)];
}

function structuralIssues(record: PersonRecord) {
  const categoryIds = new Set(record.categories.map((category) => category.id));
  const sourceIds = new Set(record.sources.map((source) => source.id));
  return [
    ...record.categories.flatMap(validateCategory),
    ...record.sources.flatMap(validateSource),
    ...validatePerson(record.person, { knownCategoryIds: categoryIds, knownSourceIds: sourceIds }),
    ...record.timeline.flatMap((event) => validateTimelineEvent(event, sourceIds)),
    ...record.education.flatMap((item) => validateEducation(item, sourceIds)),
    ...(record.person.status === "published" ? validatePublishedRecord(record) : []),
  ];
}

export function evaluatePersonReadiness(record: PersonRecord, options: { mediaUrl?: string | null } = {}): PersonReadinessResult {
  const mediaUrl = options.mediaUrl === undefined ? record.person.image : options.mediaUrl;
  const missing = requiredMissing(record);
  const recommended = recommendedMissing(record, mediaUrl);
  const media = mediaUrl?.trim() ? (getSafePublicImageUrl(mediaUrl) ? "PRESENT" : "INVALID") : "MISSING_RECOMMENDED";
  const issues = missing.length > 0 ? [] : structuralIssues(record);
  if (media === "INVALID") issues.push({ path: "person.image", message: "Public media reference must use http or https" });
  const state: PersonReadinessState =
    media === "INVALID" || issues.length > 0
      ? "BLOCKED"
      : missing.length > 0
        ? "INCOMPLETE"
        : record.person.status === "review" || record.person.status === "published"
          ? "READY_FOR_PUBLICATION"
          : "READY_FOR_REVIEW";
  const validSourceCount = record.sources.filter((source) => isValidHttpUrl(source.url)).length;
  return {
    state,
    lifecycle: record.person.status,
    required: { completed: requiredFieldLabels.length + (record.person.occupations.length > 0 && record.person.occupations.every(isNonEmpty) ? 1 : 0), total: requiredFieldLabels.length + 1, missing },
    recommended: { completed: 5 - recommended.length, total: 5, missing: recommended },
    sourceCount: record.sources.length,
    validSourceCount,
    media,
    issues,
  };
}

export type PersonListReadinessInput = {
  status: "draft" | "review" | "published" | "archived";
  name: string;
  nameArabic: string;
  slug: string;
  shortBio: string;
  biography: string;
  categoryCount: number;
  publishedCategoryCount: number;
  occupationCount: number;
  sourceCount: number;
  publishedSourceCount: number;
  imageUrl: string | null;
};

export type PersonListReadiness = {
  state: PersonReadinessState;
  requiredCompleted: number;
  requiredTotal: number;
  recommendedCompleted: number;
  recommendedTotal: number;
  missing: string[];
};

export function evaluatePersonListReadiness(input: PersonListReadinessInput): PersonListReadiness {
  const missing: string[] = [];
  if (!isNonEmpty(input.name)) missing.push("name");
  if (!isNonEmpty(input.nameArabic)) missing.push("nameArabic");
  if (!isNonEmpty(input.slug)) missing.push("slug");
  if (!isNonEmpty(input.shortBio)) missing.push("shortBio");
  if (!isNonEmpty(input.biography)) missing.push("biography");
  if (input.categoryCount === 0) missing.push("category");
  if (input.occupationCount === 0) missing.push("occupations");
  const invalidMedia = Boolean(input.imageUrl?.trim()) && !getSafePublicImageUrl(input.imageUrl);
  const publishedRelationInvalid = input.status === "published" && (input.categoryCount === 0 || input.publishedCategoryCount !== input.categoryCount || input.sourceCount === 0 || input.publishedSourceCount !== input.sourceCount);
  const state: PersonReadinessState = invalidMedia || publishedRelationInvalid ? "BLOCKED" : missing.length > 0 ? "INCOMPLETE" : input.status === "review" || input.status === "published" ? "READY_FOR_PUBLICATION" : "READY_FOR_REVIEW";
  const recommendedMissing = [
    ...(input.imageUrl ? [] : ["portrait"]),
    ...(input.sourceCount > 0 ? [] : ["sources"]),
  ];
  return {
    state,
    requiredCompleted: 7 - missing.length,
    requiredTotal: 7,
    recommendedCompleted: 2 - recommendedMissing.length,
    recommendedTotal: 2,
    missing: [...missing, ...recommendedMissing, ...(invalidMedia ? ["invalid media"] : [])],
  };
}

export function summarizePersonReadiness(results: PersonReadinessResult[]) {
  return results.reduce(
    (summary, result) => {
      summary.total += 1;
      summary[result.state] += 1;
      summary.requiredCompleted += result.required.missing.length === 0 ? 1 : 0;
      summary.withSources += result.sourceCount > 0 ? 1 : 0;
      summary.withPortrait += result.media === "PRESENT" ? 1 : 0;
      return summary;
    },
    { total: 0, READY_FOR_REVIEW: 0, READY_FOR_PUBLICATION: 0, INCOMPLETE: 0, BLOCKED: 0, requiredCompleted: 0, withSources: 0, withPortrait: 0 },
  );
}
