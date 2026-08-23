import { createHmac, timingSafeEqual } from "node:crypto";

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
  return {
    ...adminCookieOptions(),
    maxAge: 0,
  };
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

export function isAdminRequest(request: Request) {
  return isValidAdminSession(readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE));
}
