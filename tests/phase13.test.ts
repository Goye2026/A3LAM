import { describe, expect, it } from "vitest";
import { hashPassword, USER_SESSION_COOKIE, userCookieOptions, verifyPassword, validatePassword } from "@/lib/user/auth";
import { parseProfileInput, ProfileInputError, validateProfileForPublication } from "@/lib/user/profileValidation";
import { InvalidUploadError, validateUpload } from "@/lib/storage/validation";
import { parseMediaMetadataInput, MediaInputError, safeStorageKey } from "@/lib/media/validation";
import { getSafePublicImageUrl, getSafePublicUrl } from "@/lib/media/public";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { calculateProfileCompletion, projectPublicProfile, type ProfileRecord } from "@/lib/user/profileRepository";
import { getSafeAuthDestination } from "@/lib/user/redirect";

const baseProfile = {
  name: "Test Professional",
  nameArabic: "شخصية مهنية",
  slug: "test-professional",
  professionalTitle: "باحث",
  professionalSummary: "نبذة مهنية موثقة",
  biography: "",
  categoryIds: ["science"],
  visibility: "published",
  source: { title: "المصدر الرسمي", publisher: "مؤسسة رسمية", url: "https://example.com/source", type: "official" },
};

describe("Phase 13 authentication primitives", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const encoded = await hashPassword("SafePassword123");
    expect(encoded).toMatch(/^scrypt\$/);
    expect(encoded).not.toContain("SafePassword123");
    expect(await verifyPassword("SafePassword123", encoded)).toBe(true);
    expect(await verifyPassword("WrongPassword123", encoded)).toBe(false);
  });

  it("enforces a bounded password policy and separate cookie namespace", () => {
    expect(validatePassword("short1")).toBe(false);
    expect(validatePassword("SafePassword123")).toBe(true);
    expect(USER_SESSION_COOKIE).not.toBe(ADMIN_SESSION_COOKIE);
    expect(userCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });
});

describe("Phase 13 profile validation", () => {
  it("accepts a minimal valid profile and requires source for publication", () => {
    const parsed = parseProfileInput(baseProfile);
    expect(validateProfileForPublication(parsed)).toEqual([]);
    const withoutSource = parseProfileInput({ ...baseProfile, source: null });
    expect(validateProfileForPublication(withoutSource)).toContain("يجب إضافة مصدر موثوق واحد على الأقل");
  });

  it("rejects unsafe links and invalid public data", () => {
    expect(() => parseProfileInput({ ...baseProfile, socialLinks: [{ platform: "website", url: "javascript:alert(1)" }] })).toThrow(ProfileInputError);
    expect(() => parseProfileInput({ ...baseProfile, socialLinks: [{ platform: "website", url: "https://user:password@example.com/profile" }] })).toThrow(ProfileInputError);
    expect(validateProfileForPublication(parseProfileInput({ ...baseProfile, categoryIds: [] }))).toContain("يجب اختيار تصنيف واحد على الأقل للملف المنشور");
    expect(() => parseProfileInput({ ...baseProfile, experiences: [{ jobTitle: "باحث", organization: "مؤسسة", startDate: "2025-01-01", endDate: "2024-01-01", isCurrent: false }] })).toThrow(ProfileInputError);
    expect(() => parseProfileInput({ ...baseProfile, experiences: [{ jobTitle: "باحث", organization: "مؤسسة", startDate: "2025-01-01", endDate: "", isCurrent: true }] })).not.toThrow();
  });
});

describe("Phase 13 public privacy projection", () => {
  it("removes private contacts and non-public files", () => {
    const record = {
      profile: { id: "profile-1", userId: "user-1", slug: "profile-1", name: "Test", nameArabic: "اختبار", professionalTitle: "باحث", professionalSummary: "نبذة", biography: "", city: null, country: null, contactEmail: "private@example.com", phone: "+967000000", emailPublic: false, phonePublic: false, imageUrl: null, status: "published", visibility: "published", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      categories: [{ id: "science", slug: "science", name: "علوم", description: "", status: "published" }], source: { id: "source-1", title: "مصدر", publisher: "مؤسسة", url: "https://example.com", type: "official", status: "published" }, skills: [], experiences: [], educations: [], certifications: [], languages: [], portfolio: [], socialLinks: [], files: [{ id: "private", url: "https://example.com/private.pdf", originalName: "private.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 20, fileType: "cv", isPublic: false }, { id: "public", url: "https://example.com/public.pdf", originalName: "public.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 20, fileType: "cv", isPublic: true }],
    } as ProfileRecord;
    const projection = projectPublicProfile(record);
    expect(projection.email).toBeNull();
    expect(projection.phone).toBeNull();
    expect(projection.files.map((file) => file.id)).toEqual(["public"]);
  });
});

describe("Phase 14 profile UX contracts", () => {
  it("includes existing identity and professional sections in the advisory checklist", () => {
    const record = {
      profile: { id: "p", userId: "u", slug: "profile", name: "Name", nameArabic: "اسم", professionalTitle: "باحث", professionalSummary: "نبذة", biography: "", city: null, country: null, contactEmail: "owner@example.com", phone: null, emailPublic: false, phonePublic: false, imageUrl: "https://example.com/photo.webp", status: "draft", visibility: "private", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      categories: [], source: { id: "s", title: "مصدر", publisher: "مؤسسة", url: "https://example.com", type: "official", status: "draft" }, skills: ["بحث"], experiences: [], educations: [], certifications: [{ id: "c", name: "شهادة", issuer: "جهة", obtainedDate: null, verificationUrl: null }], languages: [{ id: "l", language: "العربية", proficiency: "متقدم" }], portfolio: [], socialLinks: [], files: [],
    } as ProfileRecord;
    const completion = calculateProfileCompletion(record);
    expect(completion.completed).toEqual(expect.arrayContaining(["الصورة الشخصية", "الشهادات", "اللغات", "وسيلة التواصل"]));
    expect(completion.remaining).toContain("الأعمال");
  });

  it("calculates an advisory completion percentage without changing publication requirements", () => {
    const empty = calculateProfileCompletion(null);
    expect(empty.percent).toBe(0);
    expect(empty.remaining).toContain("المعلومات الأساسية");
    const record = {
      profile: { id: "p", userId: "u", slug: "profile", name: "Name", nameArabic: "اسم", professionalTitle: "باحث", professionalSummary: "نبذة", biography: "", city: "صنعاء", country: "اليمن", contactEmail: null, phone: null, emailPublic: false, phonePublic: false, imageUrl: null, status: "draft", visibility: "private", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      categories: [], source: { id: "s", title: "مصدر", publisher: "مؤسسة", url: "https://example.com", type: "official", status: "draft" }, skills: ["بحث"], experiences: [], educations: [], certifications: [], languages: [], portfolio: [], socialLinks: [], files: [],
    } as ProfileRecord;
    expect(calculateProfileCompletion(record).percent).toBeGreaterThan(0);
    expect(calculateProfileCompletion(record).percent).toBeLessThan(100);
  });
});

describe("Phase 16.1 auth continuation", () => {
  it("preserves internal paths and rejects external redirect targets", () => {
    expect(getSafeAuthDestination("/account/profile?step=2#source")).toBe("/account/profile?step=2#source");
    expect(getSafeAuthDestination("https://evil.example/account")).toBe("/account");
    expect(getSafeAuthDestination("//evil.example/account")).toBe("/account");
    expect(getSafeAuthDestination("/account\\\\evil")).toBe("/account");
    expect(getSafeAuthDestination(undefined, "/account?welcome=1")).toBe("/account?welcome=1");
  });
});

describe("Phase 13 request security", () => {
  it("accepts same origin and rejects a foreign origin in production", () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = env.NODE_ENV;
    const previousSite = env.NEXT_PUBLIC_SITE_URL;
    env.NODE_ENV = "production";
    env.NEXT_PUBLIC_SITE_URL = "https://a3-lam.vercel.app";
    expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/auth/login", { method: "POST", headers: { origin: "https://a3-lam.vercel.app" } }))).toBe(true);
    expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/auth/login", { method: "POST", headers: { origin: "https://evil.example" } }))).toBe(false);
    if (previousNodeEnv === undefined) delete env.NODE_ENV; else env.NODE_ENV = previousNodeEnv;
    if (previousSite === undefined) delete env.NEXT_PUBLIC_SITE_URL; else env.NEXT_PUBLIC_SITE_URL = previousSite;
  });
});

describe("Phase 13 upload validation", () => {
  it("accepts matching PDF signature and rejects mismatched content", async () => {
    const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])], "cv.pdf", { type: "application/pdf" });
    await expect(validateUpload(pdf, "cv")).resolves.toMatchObject({ extension: "pdf", mimeType: "application/pdf" });
    const fake = new File(["not a pdf"], "cv.pdf", { type: "application/pdf" });
    await expect(validateUpload(fake, "cv")).rejects.toBeInstanceOf(InvalidUploadError);
  });

  it("rejects executable extensions and unsafe names", async () => {
    const exe = new File(["MZ"], "run.exe", { type: "application/octet-stream" });
    await expect(validateUpload(exe, "document")).rejects.toBeInstanceOf(InvalidUploadError);
    const unsafe = new File([new Uint8Array([0xff, 0xd8, 0xff])], "../photo.jpg", { type: "image/jpeg" });
    await expect(validateUpload(unsafe, "portrait")).rejects.toBeInstanceOf(InvalidUploadError);
  });
});


describe("Phase 17.16 media foundation", () => {
  it("validates image signatures and extracts PNG dimensions", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00]);
    await expect(validateUpload(new File([png], "portrait.png", { type: "image/png" }), "portrait")).resolves.toMatchObject({ extension: "png", mimeType: "image/png", dimensions: { width: 1, height: 1 } });
    await expect(validateUpload(new File([png], "portrait.jpg", { type: "image/jpeg" }), "portrait")).rejects.toBeInstanceOf(InvalidUploadError);
  });

  it("requires source and license before public visibility", () => {
    expect(() => parseMediaMetadataInput({ altText: "صورة", sourceUrl: null, attribution: "", license: "", visibility: "public" })).toThrow(MediaInputError);
    expect(parseMediaMetadataInput({ altText: "صورة", sourceUrl: "https://example.com/image", attribution: "Example", license: "CC BY", visibility: "public" })).toMatchObject({ visibility: "public", sourceUrl: "https://example.com/image" });
  });

  it("accepts only controlled editorial storage keys and public URLs", () => {
    expect(safeStorageKey("editorial/people/person-1/portrait-123e4567-e89b-12d3-a456-426614174000.png")).toContain("editorial/people/");
    expect(() => safeStorageKey("../secret.png")).toThrow(MediaInputError);
    expect(getSafePublicImageUrl("javascript:alert(1)")).toBeNull();
    expect(getSafePublicImageUrl("https://cdn.example.com/portrait.png")).toBe("https://cdn.example.com/portrait.png");
    expect(getSafePublicUrl("https://user:password@example.com/file")).toBeNull();
  });

  it("sanitizes all public professional-profile URL projections", () => {
    const record = {
      profile: { id: "p", userId: "u", slug: "profile", name: "Name", nameArabic: "اسم", professionalTitle: "باحث", professionalSummary: "نبذة", biography: "", city: null, country: null, contactEmail: null, phone: null, emailPublic: false, phonePublic: false, imageUrl: "javascript:alert(1)", status: "published", visibility: "published", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      categories: [{ id: "science", slug: "science", name: "علوم", description: "", status: "published" }], source: { id: "s", title: "مصدر", publisher: "مؤسسة", url: "https://example.com/source", type: "official", status: "published" }, skills: [], experiences: [], educations: [], certifications: [{ id: "c", name: "شهادة", issuer: "جهة", obtainedDate: null, verificationUrl: "data:text/html,alert(1)" }], languages: [], portfolio: [{ id: "w", title: "عمل", description: "", url: "file:///tmp/work", coverUrl: "https://example.com/cover.png", workType: "project" }], socialLinks: [{ id: "x", platform: "website", url: "vbscript:alert(1)" }], files: [{ id: "f", url: "javascript:alert(1)", originalName: "public.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 20, fileType: "cv", isPublic: true }],
    } as ProfileRecord;
    const projection = projectPublicProfile(record);
    expect(projection.imageUrl).toBeNull();
    expect(projection.certifications[0]?.verificationUrl).toBeNull();
    expect(projection.portfolio[0]?.url).toBeNull();
    expect(projection.portfolio[0]?.coverUrl).toBe("https://example.com/cover.png");
    expect(projection.socialLinks).toEqual([]);
    expect(projection.files).toEqual([]);
  });
});
