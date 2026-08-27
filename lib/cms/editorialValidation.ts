import { getSafePublicUrl } from "@/lib/media/public";
import { parseCmsRichTextDocument, type CmsRichTextDocument } from "./richText";
import { assertCmsSlug } from "./slug";
import { isCmsEditorialStatus, type CmsEditorialStatus } from "./editorialStatus";
import type { CmsBulkStatusInput, CmsEditorialMutation, CmsTagInput } from "./editorialTypes";

const CMS_TEMPLATE_BY_KIND = { page: "single-page", post: "single-post" } as const;

export class CmsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsInputError";
  }
}

function text(value: unknown, field: string, max: number, required = false) {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new CmsInputError(`${field} must be text`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new CmsInputError(`${field} is required`);
  if (normalized.length > max) throw new CmsInputError(`${field} is too long`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(normalized)) throw new CmsInputError(`${field} contains unsupported control characters`);
  return normalized;
}

function ids(value: unknown, field: string) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 50) throw new CmsInputError(`${field} has an invalid size`);
  const values = value.map((item, index) => text(item, `${field}.${index}`, 160, true));
  return [...new Set(values)];
}

function optionalUrl(value: unknown, field: string) {
  const normalized = text(value, field, 2_000);
  if (!normalized) return null;
  if (!getSafePublicUrl(normalized)) throw new CmsInputError(`${field} must be a valid public http or https URL`);
  return normalized;
}

export function parseCmsEditorialMutation(value: unknown, kind: "page" | "post"): CmsEditorialMutation {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsInputError("The submitted editorial payload is invalid");
  const item = value as Record<string, unknown>;
  const expectedVersion = item.expectedVersion === undefined ? undefined : Number(item.expectedVersion);
  if (expectedVersion !== undefined && (!Number.isInteger(expectedVersion) || expectedVersion < 1)) throw new CmsInputError("expectedVersion is invalid");
  const content = parseCmsRichTextDocument(item.content);
  const categoryIds = ids(item.categoryIds, "categoryIds");
  const tagIds = ids(item.tagIds, "tagIds");
  if (kind === "page" && (tagIds.length > 0 || categoryIds.length > 0)) throw new CmsInputError("Pages do not accept taxonomy");
  const template = text(item.template, "template", 100, true);
  if (template !== CMS_TEMPLATE_BY_KIND[kind]) throw new CmsInputError(`${kind} template is not supported`);
  const featuredMediaId = text(item.featuredMediaId, "featuredMediaId", 160);
  return {
    title: text(item.title, "title", 300, true),
    slug: assertCmsSlug(item.slug),
    content,
    excerpt: text(item.excerpt, "excerpt", 2_000),
    featuredMediaId: featuredMediaId || null,
    template,
    seoTitle: text(item.seoTitle, "seoTitle", 300),
    seoDescription: text(item.seoDescription, "seoDescription", 2_000),
    canonicalUrl: optionalUrl(item.canonicalUrl, "canonicalUrl"),
    categoryIds,
    tagIds,
    expectedVersion,
  };
}

export function parseCmsTagInput(value: unknown): CmsTagInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsInputError("The submitted tag payload is invalid");
  const item = value as Record<string, unknown>;
  return {
    name: text(item.name, "name", 200, true),
    slug: assertCmsSlug(item.slug),
  };
}

export function parseExpectedVersion(value: unknown) {
  const version = Number(value);
  if (!Number.isInteger(version) || version < 1) throw new CmsInputError("expectedVersion is invalid");
  return version;
}

export function assertCmsIdentifier(value: unknown, field = "id") {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(value)) throw new CmsInputError(`${field} is invalid`);
  return value;
}

export function parseCmsBulkStatusInput(value: unknown): CmsBulkStatusInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsInputError("The bulk payload is invalid");
  const item = value as Record<string, unknown>;
  const rawIds = item.ids;
  if (!Array.isArray(rawIds) || rawIds.length < 1 || rawIds.length > 50) throw new CmsInputError("ids has an invalid size");
  const idsValue = [...new Set(rawIds.map((id, index) => assertCmsIdentifier(id, `ids.${index}`)))];
  if (idsValue.length !== rawIds.length) throw new CmsInputError("ids must be unique");
  const status = item.status;
  if (!isCmsEditorialStatus(status)) throw new CmsInputError("status is invalid");
  if (!item.expectedVersions || typeof item.expectedVersions !== "object" || Array.isArray(item.expectedVersions)) throw new CmsInputError("expectedVersions is invalid");
  const rawVersions = item.expectedVersions as Record<string, unknown>;
  const expectedVersions: Record<string, number> = {};
  for (const id of idsValue) expectedVersions[id] = parseExpectedVersion(rawVersions[id]);
  if (Object.keys(rawVersions).some((id) => !idsValue.includes(id))) throw new CmsInputError("expectedVersions contains an unknown id");
  return { ids: idsValue, status: status as CmsEditorialStatus, expectedVersions };
}

export function parseCmsRevisionRestoreInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsInputError("The revision restore payload is invalid");
  const item = value as Record<string, unknown>;
  return { revisionId: assertCmsIdentifier(item.revisionId, "revisionId"), expectedVersion: parseExpectedVersion(item.expectedVersion) };
}

export function assertCmsRichText(value: unknown): asserts value is CmsRichTextDocument {
  parseCmsRichTextDocument(value);
}
