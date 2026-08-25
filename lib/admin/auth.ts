import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { AdminPrincipal, AdminRoleCode } from "@/lib/admin/types";

export const ADMIN_SESSION_COOKIE = "a3lam_admin_session";
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

function configuredToken() {
  const token = process.env.A3LAM_ADMIN_ACCESS_TOKEN?.trim();
  return token && token.length >= 32 ? token : null;
}

function sessionTtlSeconds() {
  const value = Number.parseInt(process.env.A3LAM_ADMIN_SESSION_TTL_SECONDS ?? String(DEFAULT_SESSION_TTL_SECONDS), 10);
  return Number.isFinite(value) && value > 0 && value <= 7 * 24 * 60 * 60 ? value : DEFAULT_SESSION_TTL_SECONDS;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(timestamp: string, token: string) {
  return createHmac("sha256", token).update(`a3lam-admin:${timestamp}`).digest("hex");
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isAdminAccessConfigured() {
  return configuredToken() !== null;
}

export function createAdminSession() {
  const token = configuredToken();
  if (!token) throw new Error("A3LAM_ADMIN_ACCESS_TOKEN is not configured");
  const timestamp = String(Math.floor(Date.now() / 1000));
  return `${timestamp}.${signature(timestamp, token)}`;
}

export function isValidAdminSession(value: string | null | undefined) {
  const token = configuredToken();
  if (!token || !value) return false;
  const [timestamp, providedSignature] = value.split(".");
  if (!timestamp || !providedSignature || !/^\d+$/.test(timestamp)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (age < 0 || age > sessionTtlSeconds()) return false;
  return safeEqual(providedSignature, signature(timestamp, token));
}

export async function createAdminDbSession(adminId: string, metadata: { userAgent?: string | null; ipAddress?: string | null } = {}) {
  const db = getDb();
  const identityRows = await db.select({ id: schema.adminIdentities.id, status: schema.adminIdentities.status }).from(schema.adminIdentities).where(eq(schema.adminIdentities.id, adminId)).limit(1);
  const identity = identityRows[0];
  if (!identity || identity.status !== "active") throw new Error("Admin identity is not active");
  const rawToken = randomBytes(32).toString("base64url");
  const sessionId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionTtlSeconds() * 1000);
  await db.transaction(async (tx) => {
    await tx.insert(schema.adminSessions).values({ id: sessionId, adminId, tokenHash: hashSessionToken(rawToken), expiresAt, createdAt: now, lastActivityAt: now, userAgent: metadata.userAgent?.slice(0, 512) ?? null, ipAddress: metadata.ipAddress?.slice(0, 128) ?? null });
    await tx.update(schema.adminIdentities).set({ lastSignedIn: now, lastActivityAt: now, updatedAt: now }).where(eq(schema.adminIdentities.id, adminId));
    await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId: adminId, entityType: "admin_session", entityId: sessionId, field: "signed_in", oldValue: null, newValue: now.toISOString(), action: "create_admin_session", reason: null });
  });
  return rawToken;
}

export async function revokeAdminDbSession(sessionValue: string | null | undefined) {
  if (!sessionValue || isValidAdminSession(sessionValue)) return false;
  const db = getDb();
  return db.transaction(async (tx) => {
    const revokedAt = new Date();
    const rows = await tx.update(schema.adminSessions).set({ revokedAt }).where(and(eq(schema.adminSessions.tokenHash, hashSessionToken(sessionValue)), isNull(schema.adminSessions.revokedAt))).returning({ id: schema.adminSessions.id, adminId: schema.adminSessions.adminId });
    const row = rows[0];
    if (!row) return false;
    await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId: row.adminId, entityType: "admin_session", entityId: row.id, field: "revoked_at", oldValue: null, newValue: revokedAt.toISOString(), action: "logout_admin", reason: null });
    return true;
  });
}

export function isValidAdminAccessToken(value: unknown) {
  const token = configuredToken();
  return typeof value === "string" && token !== null && safeEqual(value, token);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtlSeconds(),
    path: "/",
  };
}

export function adminLogoutCookieOptions() {
  return { ...adminCookieOptions(), maxAge: 0 };
}

export function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function legacyPrincipal(): AdminPrincipal {
  return { id: null, email: null, displayName: "Legacy Admin", role: "SUPER_ADMIN", sessionId: null, legacy: true };
}

export async function getAdminPrincipal(sessionValue: string | null | undefined): Promise<AdminPrincipal | null> {
  if (!sessionValue) return null;
  if (isValidAdminSession(sessionValue)) return legacyPrincipal();
  try {
    const tokenHash = hashSessionToken(sessionValue);
    const rows = await getDb()
      .select({ identity: schema.adminIdentities, role: schema.adminRoleAssignments.roleCode, sessionId: schema.adminSessions.id })
      .from(schema.adminSessions)
      .innerJoin(schema.adminIdentities, eq(schema.adminSessions.adminId, schema.adminIdentities.id))
      .innerJoin(schema.adminRoleAssignments, eq(schema.adminRoleAssignments.adminId, schema.adminIdentities.id))
      .where(and(eq(schema.adminSessions.tokenHash, tokenHash), isNull(schema.adminSessions.revokedAt), gt(schema.adminSessions.expiresAt, new Date()), eq(schema.adminIdentities.status, "active")))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const now = new Date();
    await getDb().transaction(async (tx) => {
      await tx.update(schema.adminSessions).set({ lastActivityAt: now }).where(eq(schema.adminSessions.id, row.sessionId));
      await tx.update(schema.adminIdentities).set({ lastActivityAt: now, updatedAt: now }).where(eq(schema.adminIdentities.id, row.identity.id));
    });
    return { id: row.identity.id, email: row.identity.email, displayName: row.identity.displayName, role: row.role as AdminRoleCode, sessionId: row.sessionId, legacy: false };
  } catch {
    return null;
  }
}

export async function getAdminPrincipalFromRequest(request: Request) {
  return getAdminPrincipal(readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE));
}

export function isAdminRequest(request: Request) {
  return isValidAdminSession(readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE));
}
