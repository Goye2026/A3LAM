import type { ProfileSocialPlatform, ProfileVisibility, ProfileWorkType, SourceType } from "@/lib/domain/a3lam";
import { getSafePublicUrl } from "@/lib/media/public";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOCIAL_PLATFORMS: ProfileSocialPlatform[] = ["linkedin", "x", "facebook", "instagram", "github", "youtube", "website"];
const WORK_TYPES: ProfileWorkType[] = ["project", "article", "book", "design", "research", "website", "application", "video", "product"];
const SOURCE_TYPES: SourceType[] = ["official", "institution", "government", "media", "professional", "academic", "secondary"];

export class ProfileInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileInputError";
  }
}

export type ProfileInput = {
  name: string;
  nameArabic: string;
  slug: string;
  professionalTitle: string;
  professionalSummary: string;
  biography: string;
  city: string;
  country: string;
  contactEmail: string;
  phone: string;
  emailPublic: boolean;
  phonePublic: boolean;
  visibility: ProfileVisibility;
  categoryIds: string[];
  imageUrl: string;
  source: {
    id?: string;
    title: string;
    publisher: string;
    url: string;
    type: SourceType;
  } | null;
  skills: string[];
  experiences: Array<{ id?: string; jobTitle: string; organization: string; location: string; startDate: string; endDate: string; isCurrent: boolean; description: string }>;
  educations: Array<{ id?: string; institution: string; degree: string; field: string; startDate: string; endDate: string; description: string }>;
  certifications: Array<{ id?: string; name: string; issuer: string; obtainedDate: string; verificationUrl: string }>;
  languages: Array<{ id?: string; language: string; proficiency: string }>;
  portfolio: Array<{ id?: string; title: string; description: string; url: string; coverUrl: string; workType: ProfileWorkType }>;
  socialLinks: Array<{ id?: string; platform: ProfileSocialPlatform; url: string }>;
};

function text(value: unknown, field: string, max: number, required = false) {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new ProfileInputError(`${field} يجب أن يكون نصًا`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new ProfileInputError(`${field} مطلوب`);
  if (normalized.length > max) throw new ProfileInputError(`${field} طويل أكثر من اللازم`);
  return normalized;
}

function optionalDate(value: unknown, field: string) {
  const normalized = text(value, field, 10);
  if (!normalized) return "";
  if (!DATE_PATTERN.test(normalized) || Number.isNaN(new Date(`${normalized}T00:00:00.000Z`).getTime())) throw new ProfileInputError(`${field} يجب أن يكون تاريخًا صالحًا`);
  return normalized;
}

function validateRange(startDate: string, endDate: string, field: string, isCurrent = false) {
  if (isCurrent && endDate) throw new ProfileInputError(`${field} لا يمكن أن يحتوي نهاية مع حالة العمل الحالية`);
  if (startDate && endDate && endDate < startDate) throw new ProfileInputError(`${field} يحتوي نطاقًا زمنيًا غير صالح`);
}

function url(value: unknown, field: string, required = false) {
  const normalized = text(value, field, 2000, required);
  if (!normalized) return "";
  const safe = getSafePublicUrl(normalized);
  if (!safe) throw new ProfileInputError(`${field} يسمح فقط بروابط عامة http وhttps`);
  return safe;
}

function stringArray(value: unknown, field: string, maxItems: number, maxLength = 200) {
  if (!Array.isArray(value)) throw new ProfileInputError(`${field} يجب أن تكون قائمة`);
  if (value.length > maxItems) throw new ProfileInputError(`${field} تحتوي عناصر كثيرة`);
  return [...new Set(value.map((item, index) => text(item, `${field}.${index}`, maxLength, true)))];
}

function objectArray(value: unknown, field: string, maxItems: number) {
  if (!Array.isArray(value)) throw new ProfileInputError(`${field} يجب أن تكون قائمة`);
  if (value.length > maxItems) throw new ProfileInputError(`${field} تحتوي عناصر كثيرة`);
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new ProfileInputError(`${field} يحتوي عنصرًا غير صالح`);
    return item as Record<string, unknown>;
  });
}

function parseSource(value: unknown): ProfileInput["source"] {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "object") throw new ProfileInputError("المصدر غير صالح");
  const item = value as Record<string, unknown>;
  const titleValue = typeof item.title === "string" ? item.title.trim() : "";
  const publisherValue = typeof item.publisher === "string" ? item.publisher.trim() : "";
  const urlValue = typeof item.url === "string" ? item.url.trim() : "";
  if (!titleValue && !publisherValue && !urlValue) return null;
  const type = text(item.type, "source.type", 30, true) as SourceType;
  if (!SOURCE_TYPES.includes(type)) throw new ProfileInputError("نوع المصدر غير صالح");
  return {
    id: item.id ? text(item.id, "source.id", 120) : undefined,
    title: text(item.title, "source.title", 500, true),
    publisher: text(item.publisher, "source.publisher", 300, true),
    url: url(item.url, "source.url", true),
    type,
  };
}

export function parseProfileInput(value: unknown): ProfileInput {
  if (!value || typeof value !== "object") throw new ProfileInputError("بيانات الملف غير صالحة");
  const item = value as Record<string, unknown>;
  const visibility = text(item.visibility ?? "private", "visibility", 20) as ProfileVisibility;
  if (!["private", "unlisted", "published"].includes(visibility)) throw new ProfileInputError("إعداد الظهور غير صالح");
  const categoryIds = stringArray(item.categoryIds ?? [], "categoryIds", 20, 120);
  const skills = stringArray(item.skills ?? [], "skills", 50, 120);
  const experiences = objectArray(item.experiences ?? [], "experiences", 30).map((entry, index) => ({
    id: entry.id ? text(entry.id, `experiences.${index}.id`, 120) : undefined,
    jobTitle: text(entry.jobTitle, `experiences.${index}.jobTitle`, 300, true),
    organization: text(entry.organization, `experiences.${index}.organization`, 300, true),
    location: text(entry.location, `experiences.${index}.location`, 200),
    startDate: optionalDate(entry.startDate, `experiences.${index}.startDate`),
    endDate: optionalDate(entry.endDate, `experiences.${index}.endDate`),
    isCurrent: entry.isCurrent === true,
    description: text(entry.description, `experiences.${index}.description`, 5000),
  })).map((entry, index) => { validateRange(entry.startDate, entry.endDate, `experiences.${index}` , entry.isCurrent); return entry; });
  const educations = objectArray(item.educations ?? [], "educations", 30).map((entry, index) => ({
    id: entry.id ? text(entry.id, `educations.${index}.id`, 120) : undefined,
    institution: text(entry.institution, `educations.${index}.institution`, 300, true),
    degree: text(entry.degree, `educations.${index}.degree`, 200),
    field: text(entry.field, `educations.${index}.field`, 300),
    startDate: optionalDate(entry.startDate, `educations.${index}.startDate`),
    endDate: optionalDate(entry.endDate, `educations.${index}.endDate`),
    description: text(entry.description, `educations.${index}.description`, 5000),
  })).map((entry, index) => { validateRange(entry.startDate, entry.endDate, `educations.${index}`); return entry; });
  const certifications = objectArray(item.certifications ?? [], "certifications", 30).map((entry, index) => ({
    id: entry.id ? text(entry.id, `certifications.${index}.id`, 120) : undefined,
    name: text(entry.name, `certifications.${index}.name`, 300, true),
    issuer: text(entry.issuer, `certifications.${index}.issuer`, 300, true),
    obtainedDate: optionalDate(entry.obtainedDate, `certifications.${index}.obtainedDate`),
    verificationUrl: url(entry.verificationUrl, `certifications.${index}.verificationUrl`),
  }));
  const languages = objectArray(item.languages ?? [], "languages", 30).map((entry, index) => ({
    id: entry.id ? text(entry.id, `languages.${index}.id`, 120) : undefined,
    language: text(entry.language, `languages.${index}.language`, 120, true),
    proficiency: text(entry.proficiency, `languages.${index}.proficiency`, 120, true),
  }));
  const portfolio = objectArray(item.portfolio ?? [], "portfolio", 30).map((entry, index) => {
    const workType = text(entry.workType, `portfolio.${index}.workType`, 30, true) as ProfileWorkType;
    if (!WORK_TYPES.includes(workType)) throw new ProfileInputError(`portfolio.${index}.workType غير صالح`);
    return {
      id: entry.id ? text(entry.id, `portfolio.${index}.id`, 120) : undefined,
      title: text(entry.title, `portfolio.${index}.title`, 300, true),
      description: text(entry.description, `portfolio.${index}.description`, 5000),
      url: url(entry.url, `portfolio.${index}.url`),
      coverUrl: url(entry.coverUrl, `portfolio.${index}.coverUrl`),
      workType,
    };
  });
  const socialLinks = objectArray(item.socialLinks ?? [], "socialLinks", 20).map((entry, index) => {
    const platform = text(entry.platform, `socialLinks.${index}.platform`, 30, true) as ProfileSocialPlatform;
    if (!SOCIAL_PLATFORMS.includes(platform)) throw new ProfileInputError(`socialLinks.${index}.platform غير صالح`);
    return { id: entry.id ? text(entry.id, `socialLinks.${index}.id`, 120) : undefined, platform, url: url(entry.url, `socialLinks.${index}.url`, true) };
  });
  const contactEmail = text(item.contactEmail, "contactEmail", 320);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new ProfileInputError("البريد المهني غير صالح");
  const source = parseSource(item.source);
  return {
    name: text(item.name, "name", 300, true),
    nameArabic: text(item.nameArabic, "nameArabic", 300, true),
    slug: (() => { const value = text(item.slug, "slug", 120, true); if (!SLUG_PATTERN.test(value)) throw new ProfileInputError("الرابط المختصر غير صالح"); return value; })(),
    professionalTitle: text(item.professionalTitle, "professionalTitle", 300),
    professionalSummary: text(item.professionalSummary, "professionalSummary", 5000),
    biography: text(item.biography, "biography", 100000),
    city: text(item.city, "city", 200),
    country: text(item.country, "country", 200),
    contactEmail,
    phone: text(item.phone, "phone", 80),
    emailPublic: item.emailPublic === true,
    phonePublic: item.phonePublic === true,
    visibility,
    categoryIds,
    imageUrl: url(item.imageUrl, "imageUrl"),
    source,
    skills,
    experiences,
    educations,
    certifications,
    languages,
    portfolio,
    socialLinks,
  };
}

export function validateProfileForPublication(input: ProfileInput) {
  const issues: string[] = [];
  if (!input.professionalSummary && !input.biography) issues.push("يجب إضافة نبذة مهنية أو سيرة");
  if (["published", "unlisted"].includes(input.visibility) && input.categoryIds.length === 0) issues.push("يجب اختيار تصنيف واحد على الأقل للملف المنشور");
  if (!input.source) issues.push("يجب إضافة مصدر موثوق واحد على الأقل");
  if (input.emailPublic && !input.contactEmail) issues.push("لا يمكن إظهار بريد فارغ");
  if (input.phonePublic && !input.phone) issues.push("لا يمكن إظهار هاتف فارغ");
  return issues;
}
