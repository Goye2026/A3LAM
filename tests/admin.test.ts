import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSession, isAdminAccessConfigured, isAdminRequest, isValidAdminSession } from "@/lib/admin/auth";
import { buildPersonRecord, parseAdminCategoryInput, parseAdminPersonInput } from "@/lib/admin/records";
import type { Category } from "@/lib/domain/a3lam";

const token = "phase-11-local-admin-token-012345678901234567890";
const category: Category = { id: "media", slug: "media", name: "الإعلام", description: "تصنيف اختباري.", status: "published" };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Phase 11 admin authentication", () => {
  it("requires a sufficiently long environment token and signs a session", () => {
    vi.stubEnv("A3LAM_ADMIN_ACCESS_TOKEN", token);
    vi.stubEnv("NODE_ENV", "test");
    expect(isAdminAccessConfigured()).toBe(true);
    const session = createAdminSession();
    expect(isValidAdminSession(session)).toBe(true);
    expect(isValidAdminSession(`${session}x`)).toBe(false);
    expect(isAdminRequest(new Request("http://localhost", { headers: { cookie: `a3lam_admin_session=${encodeURIComponent(session)}` } }))).toBe(true);
  });

  it("stays unavailable when no token is configured", () => {
    expect(isAdminAccessConfigured()).toBe(false);
    expect(isValidAdminSession(null)).toBe(false);
  });
});

describe("Phase 11 admin category input", () => {
  it("normalizes a valid category payload for publication", () => {
    expect(parseAdminCategoryInput({ name: "  الإعلام  ", description: "وصف", slug: "media" })).toEqual({ name: "الإعلام", description: "وصف", slug: "media", status: "published" });
  });

  it("rejects invalid category names and slugs", () => {
    expect(() => parseAdminCategoryInput({ name: "", description: "وصف", slug: "media" })).toThrow(/name/);
    expect(() => parseAdminCategoryInput({ name: "الإعلام", description: "وصف", slug: "Media" })).toThrow(/slug/);
  });
});

describe("Phase 11 admin input", () => {
  it("allows an intentionally incomplete draft without weakening published validation", () => {
    const input = parseAdminPersonInput({ name: "Draft Person", nameArabic: "مسودة شخصية", slug: "draft-person", status: "draft", categoryIds: [], occupations: [], sources: [], timeline: [], education: [] });
    const record = buildPersonRecord(input, [category]);
    expect(record.person.status).toBe("draft");
    expect(record.person.name).toBe("Draft Person");
    expect(record.sources).toEqual([]);
  });

  it("requires timeline source references to have source IDs in the same payload", () => {
    expect(() => parseAdminPersonInput({ name: "Draft Person", nameArabic: "مسودة شخصية", slug: "draft-person", status: "draft", categoryIds: [], occupations: [], sources: [], timeline: [{ date: "2026-01-01", title: "حدث", description: "وصف", sourceIds: ["missing"] }], education: [] })).toThrow(/source/);
  });
});
