import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const scryptAsync = promisify(scrypt);
export const USER_SESSION_COOKIE = "a3lam_user_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function publicUser(row: typeof schema.userAccounts.$inferSelect): UserAccount {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function normalizeUserEmail(value: string) {
  return normalizeEmail(value);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [algorithm, salt, expectedHex] = encoded.split("$");
    if (algorithm !== "scrypt" || !salt || !expectedHex || expectedHex.length !== 128 || !/^[a-f0-9]+$/i.test(expectedHex)) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, "hex");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export function validatePassword(password: string) {
  return password.length >= 10 && password.length <= 200 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function userCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  };
}

export function userLogoutCookieOptions() {
  return { ...userCookieOptions(), maxAge: 0 };
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const rows = await db.select().from(schema.userAccounts).where(eq(schema.userAccounts.emailNormalized, normalizeEmail(email))).limit(1);
  return rows[0] ?? null;
}

export async function createUserAccount(name: string, email: string, password: string) {
  const db = getDb();
  const id = randomUUID();
  const now = new Date();
  const normalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  const rows = await db.insert(schema.userAccounts).values({
    id,
    name: name.trim(),
    email: email.trim(),
    emailNormalized: normalized,
    passwordHash,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  }).returning();
  return rows[0] ? publicUser(rows[0]) : null;
}

export async function updateLastSignedIn(userId: string) {
  await getDb().update(schema.userAccounts).set({ lastSignedIn: new Date(), updatedAt: new Date() }).where(eq(schema.userAccounts.id, userId));
}

export async function createUserSession(userId: string) {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  await db.insert(schema.userSessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    createdAt: now,
  });
  return { token, expiresAt };
}

export async function revokeUserSession(token: string | null | undefined) {
  if (!token) return;
  await getDb().update(schema.userSessions).set({ revokedAt: new Date() }).where(eq(schema.userSessions.tokenHash, hashSessionToken(token)));
}

export async function getUserForToken(token: string | null | undefined): Promise<UserAccount | null> {
  if (!token) return null;
  const rows = await getDb()
    .select({ user: schema.userAccounts })
    .from(schema.userSessions)
    .innerJoin(schema.userAccounts, eq(schema.userSessions.userId, schema.userAccounts.id))
    .where(and(eq(schema.userSessions.tokenHash, hashSessionToken(token)), isNull(schema.userSessions.revokedAt), gt(schema.userSessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ? publicUser(rows[0].user) : null;
}

export async function getUserFromRequest(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  const token = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${USER_SESSION_COOKIE}=`))?.slice(USER_SESSION_COOKIE.length + 1) ?? null;
  try { return getUserForToken(token ? decodeURIComponent(token) : null); } catch { return null; }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    return await getUserForToken(cookieStore.get(USER_SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}
