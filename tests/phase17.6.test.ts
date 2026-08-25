import { describe, expect, it } from "vitest";
import { pageCount, parsePositivePage } from "@/lib/admin/pagination";
import { applyPermissionOverrides, canRevokeSuperAdminSession, canSoleSuperAdminRetainCorePermissions, hasAdminPermission } from "@/lib/admin/rbac";
import { parseSiteExperienceConfig, siteExperienceDefaults } from "@/lib/site-experience/config";

describe("Phase 17.6 operational boundaries", () => {
  it("bounds invalid and oversized page values", () => {
    expect(parsePositivePage(undefined)).toBe(1);
    expect(parsePositivePage("0")).toBe(1);
    expect(parsePositivePage("not-a-page")).toBe(1);
    expect(parsePositivePage("10001")).toBe(10_000);
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(41, 20)).toBe(3);
  });

  it("keeps role defaults, overrides, and last-super-admin protection explicit", () => {
    expect(hasAdminPermission("EDITOR", "people.update")).toBe(true);
    expect(hasAdminPermission("EDITOR", "admins.manage")).toBe(false);
    expect(applyPermissionOverrides("EDITOR", [{ permissionCode: "categories.update", effect: "allow" }]).has("categories.update")).toBe(true);
    expect(canRevokeSuperAdminSession("SUPER_ADMIN", 1)).toBe(false);
    expect(canSoleSuperAdminRetainCorePermissions("SUPER_ADMIN", 1, new Set(["admins.manage", "permissions.assign", "system.read"]))).toBe(true);
  });

  it("accepts only the typed Site Experience defaults", () => {
    const parsed = parseSiteExperienceConfig("navigation", siteExperienceDefaults.navigation);
    expect(parsed.header.every((item) => item.href.startsWith("/") || item.href.startsWith("http"))).toBe(true);
    expect(() => parseSiteExperienceConfig("navigation", { ...siteExperienceDefaults.navigation, header: [{ ...siteExperienceDefaults.navigation.header[0], href: "javascript:alert(1)" }] })).toThrow(/Invalid/);
  });
});
