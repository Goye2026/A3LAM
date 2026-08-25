import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSession, isAdminAccessConfigured, isAdminRequest, isValidAdminSession } from "@/lib/admin/auth";
import { buildPersonRecord, parseAdminCategoryInput, parseAdminPersonInput } from "@/lib/admin/records";
import { parseAdminIdentityCreateBody, parseAdminIdentityUpdateBody, parsePermissionOverridesBody } from "@/lib/admin/input";
import type { Category } from "@/lib/domain/a3lam";
import { applyPermissionOverrides, canAdminRoleManageRole, canRevokeSuperAdminSession, canSoleSuperAdminRetainCorePermissions, effectivePermissionsForPrincipal, hasAdminPermission, isFinalSuperAdminDeletionAllowed, permissionsForRole } from "@/lib/admin/rbac";
import { requirePermission } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { parseSiteExperienceConfig, siteExperienceDefaults } from "@/lib/site-experience/config";

const token = "phase-11-local-admin-token-012345678901234567890";
const category: Category = { id: "media", slug: "media", name: "الإعلام", description: "تصنيف اختباري.", status: "published" };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Phase 17 centralized RBAC policy", () => {
  it("gives only the Super Admin policy all permissions", () => {
    expect(hasAdminPermission("SUPER_ADMIN", "settings.manage")).toBe(true);
    expect(hasAdminPermission("EDITOR", "settings.manage")).toBe(false);
    expect(permissionsForRole("USER").size).toBe(0);
  });

  it("prevents role escalation and deleting the final Super Admin", () => {
    expect(canAdminRoleManageRole("ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(canAdminRoleManageRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(canAdminRoleManageRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(isFinalSuperAdminDeletionAllowed(1)).toBe(false);
    expect(isFinalSuperAdminDeletionAllowed(2)).toBe(true);
    expect(canSoleSuperAdminRetainCorePermissions("SUPER_ADMIN", 1, new Set(["admins.manage", "permissions.assign", "system.read"]))).toBe(true);
    expect(canSoleSuperAdminRetainCorePermissions("SUPER_ADMIN", 1, new Set(["admins.manage", "system.read"]))).toBe(false);
    expect(canSoleSuperAdminRetainCorePermissions("SUPER_ADMIN", 2, new Set())).toBe(true);
  });

  it("does not allow revoking the final Super Admin session", () => {
    expect(canRevokeSuperAdminSession("SUPER_ADMIN", 1)).toBe(false);
    expect(canRevokeSuperAdminSession("SUPER_ADMIN", 2)).toBe(true);
    expect(canRevokeSuperAdminSession("ADMIN", 1)).toBe(true);
    expect(canRevokeSuperAdminSession(null, 1)).toBe(true);
  });

  it("keeps the role matrix explicit and least-privilege for editors", () => {
    expect(hasAdminPermission("EDITOR", "people.update")).toBe(true);
    expect(hasAdminPermission("EDITOR", "admins.manage")).toBe(false);
    expect(hasAdminPermission("EDITOR", "sessions.revoke")).toBe(false);
    expect(hasAdminPermission("ADMIN", "sessions.read")).toBe(true);
    expect(hasAdminPermission("ADMIN", "roles.update")).toBe(false);
    expect(hasAdminPermission("SUPER_ADMIN", "roles.update")).toBe(true);
  });

  it("applies allow and deny overrides without mutating role defaults", () => {
    const defaults = permissionsForRole("EDITOR");
    const effective = applyPermissionOverrides("EDITOR", [{ permissionCode: "categories.update", effect: "allow" }, { permissionCode: "people.publish", effect: "deny" }]);
    expect(effective.has("categories.update")).toBe(true);
    expect(effective.has("people.publish")).toBe(false);
    expect(defaults.has("categories.update")).toBe(false);
    expect(defaults.has("people.publish")).toBe(true);
  });

  it("falls back to the centralized policy for the legacy principal", async () => {
    const permissions = await effectivePermissionsForPrincipal({ id: null, email: null, displayName: "Legacy Admin", role: "SUPER_ADMIN", sessionId: null, legacy: true });
    expect(permissions.has("system.read")).toBe(true);
    expect(permissions.has("sessions.revoke")).toBe(true);
  });

  it("enforces permissions on the server-side gate", async () => {
    vi.stubEnv("A3LAM_ADMIN_ACCESS_TOKEN", token);
    vi.stubEnv("NODE_ENV", "test");
    const denied = await requirePermission(new Request("http://localhost"), "settings.manage");
    expect(denied?.status).toBe(401);
    const publicUserDenied = await requirePermission(new Request("http://localhost", { headers: { cookie: "a3lam_user_session=opaque-public-user-session" } }), "users.read");
    expect(publicUserDenied?.status).toBe(401);
    const session = createAdminSession();
    const allowed = await requirePermission(new Request("http://localhost", { headers: { cookie: `a3lam_admin_session=${encodeURIComponent(session)}` } }), "settings.manage");
    expect(allowed).toBeNull();
  });
});

describe("Phase 17.3 site experience contracts", () => {
  it("accepts the typed default configuration without arbitrary executable fields", () => {
    const parsed = parseSiteExperienceConfig("homepage", siteExperienceDefaults.homepage);
    expect(parsed.sections).toHaveLength(7);
    expect(parsed.hero.primary.href).toBe("/profile/new");
  });

  it("rejects unsafe URLs and duplicate homepage section keys", () => {
    expect(() => parseSiteExperienceConfig("identity", { ...siteExperienceDefaults.identity, logoUrl: "javascript:alert(1)" })).toThrow(/Invalid/);
    const duplicate = { ...siteExperienceDefaults.homepage, sections: siteExperienceDefaults.homepage.sections.map((section, index) => index === 1 ? { ...section, key: "hero" as const } : section) };
    expect(() => parseSiteExperienceConfig("homepage", duplicate)).toThrow(/Invalid/);
  });

  it("drops unknown fields instead of persisting arbitrary configuration", () => {
    const parsed = parseSiteExperienceConfig("identity", { ...siteExperienceDefaults.identity, customJs: "alert(1)", rawCss: "body{}" });
    expect("customJs" in parsed).toBe(false);
    expect("rawCss" in parsed).toBe(false);
  });

  it("keeps mutation origin protection strict when an origin is supplied", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://a3-lam.vercel.app");
    vi.stubEnv("NODE_ENV", "production");
    expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/admin/site-experience/homepage", { headers: { origin: "https://a3-lam.vercel.app" } }))).toBe(true);
    expect(isSameOriginMutation(new Request("https://a3-lam.vercel.app/api/admin/site-experience/homepage", { headers: { origin: "https://evil.example" } }))).toBe(false);
  });
});

describe("Phase 17.1 admin identity input", () => {
  it("accepts only normalized identity fields and a known role", () => {
    expect(parseAdminIdentityCreateBody({ email: "  Admin@Example.com ", displayName: "  Admin  ", role: "ADMIN" })).toEqual({ email: "admin@example.com", displayName: "Admin", role: "ADMIN" });
    expect(parseAdminIdentityUpdateBody({ role: "EDITOR", displayName: "Editor" })).toEqual({ role: "EDITOR", displayName: "Editor" });
  });

  it("rejects unsafe or incomplete identity input", () => {
    expect(() => parseAdminIdentityCreateBody({ email: "not-an-email", displayName: "Admin", role: "ADMIN" })).toThrow(/email/);
    expect(() => parseAdminIdentityCreateBody({ email: "admin@example.com", displayName: "Admin", role: "ROOT" })).toThrow(/role/);
    expect(() => parseAdminIdentityUpdateBody({})).toThrow(/fields/);
  });

  it("accepts only bounded permission override entries", () => {
    expect(parsePermissionOverridesBody({ overrides: [{ permissionCode: "categories.update", effect: "allow" }] })).toEqual({ overrides: [{ permissionCode: "categories.update", effect: "allow" }] });
    expect(() => parsePermissionOverridesBody({ overrides: [{ permissionCode: "root.access", effect: "allow" }] })).toThrow(/permission/);
    expect(() => parsePermissionOverridesBody({ overrides: [{ permissionCode: "categories.update", effect: "allow" }, { permissionCode: "categories.update", effect: "deny" }] })).toThrow(/permission/);
  });
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
