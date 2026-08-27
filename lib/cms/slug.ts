const MAX_CMS_SLUG_LENGTH = 160;
const CMS_SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

export const CMS_RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "search",
  "categories",
  "person",
  "people",
  "profile",
  "profiles",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

export type CmsSlugValidation = { valid: true; slug: string } | { valid: false; reason: string };

export function normalizeCmsSlug(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
}

export function validateCmsSlug(value: unknown): CmsSlugValidation {
  if (typeof value !== "string") return { valid: false, reason: "slug must be text" };
  const slug = normalizeCmsSlug(value);
  if (!slug) return { valid: false, reason: "slug is required" };
  if (slug.length > MAX_CMS_SLUG_LENGTH) return { valid: false, reason: "slug is too long" };
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) return { valid: false, reason: "slug contains an unsafe path segment" };
  if (!CMS_SLUG_PATTERN.test(slug)) return { valid: false, reason: "slug contains unsupported characters" };
  if (CMS_RESERVED_SLUGS.has(slug)) return { valid: false, reason: "slug is reserved" };
  return { valid: true, slug };
}

export function assertCmsSlug(value: unknown) {
  const result = validateCmsSlug(value);
  if (!result.valid) {
    const error = new Error(result.reason);
    error.name = "CmsInputError";
    throw error;
  }
  return result.slug;
}

export function isSafeCmsInternalPath(value: string) {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("..")) return false;
  return !/^(?:\/admin|\/api)(?:\/|$)/i.test(path);
}
