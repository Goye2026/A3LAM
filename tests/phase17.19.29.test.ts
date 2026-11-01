import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 17.19.29 account security lifecycle audit contracts", () => {
  const userAuth = read("lib/user/auth.ts");
  const adminAuth = read("lib/admin/auth.ts");
  const adminRepository = read("lib/data/adminRepository.ts");
  const adminRoute = read("app/api/admin/administrators/route.ts");
  const schema = read("lib/db/schema.ts");
  const env = read(".env.example");

  it("keeps ordinary-user and Admin authentication boundaries separate", () => {
    expect(userAuth).toContain('USER_SESSION_COOKIE = "a3lam_user_session"');
    expect(adminAuth).toContain('ADMIN_SESSION_COOKIE = "a3lam_admin_session"');
    expect(userAuth).toContain("userSessions");
    expect(adminAuth).toContain("adminSessions");
    expect(adminAuth).toContain("adminIdentities");
    expect(userAuth).not.toContain("adminIdentities");
  });

  it("preserves secure hashing, token hashing, expiry, and session revocation primitives", () => {
    expect(userAuth).toContain("scrypt");
    expect(userAuth).toContain("timingSafeEqual");
    expect(userAuth).toContain("hashSessionToken");
    expect(userAuth).toContain("expiresAt");
    expect(userAuth).toContain("revokedAt");
    expect(userAuth).toContain("revokeUserSession");
    expect(adminAuth).toContain("hashSessionToken");
    expect(adminAuth).toContain("revokeAdminDbSession");
  });

  it("does not activate invited Admin identities without credentials", () => {
    expect(adminRepository).toContain('status: "invited"');
    expect(adminRepository).toContain("nextStatus === \"active\" && !current.passwordHash");
    expect(adminRepository).toContain("Admin activation requires a configured credential lifecycle");
    expect(adminRoute).toContain("invitation and credential activation are not enabled");
  });

  it("has no active reset or invitation routes in the current implementation", () => {
    const resetRoutes = ["app/api/auth/forgot-password/route.ts", "app/api/auth/reset-password/route.ts", "app/api/admin/invitations/route.ts", "app/api/admin/activate/route.ts"];
    for (const route of resetRoutes) expect(existsSync(resolve(root, route))).toBe(false);
  });

  it("has no password-reset or invitation token tables in the current schema", () => {
    expect(schema).not.toContain("passwordResetTokens");
    expect(schema).not.toContain("adminInvitations");
    expect(schema).not.toContain("reset_tokens");
    expect(schema).not.toContain("admin_invitations");
  });

  it("does not claim an email provider or production rate limiter is configured", () => {
    expect(env).not.toMatch(/RESEND|SENDGRID|SMTP|MAILGUN|POSTMARK/iu);
    expect(env).not.toMatch(/REDIS|UPSTASH|RATE_LIMIT_URL/iu);
  });
});
