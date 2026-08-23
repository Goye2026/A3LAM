import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  adminLogoutCookieOptions,
  createAdminSession,
  isAdminAccessConfigured,
  isValidAdminAccessToken,
} from "@/lib/admin/auth";
import { safeErrors } from "@/lib/errors/taxonomy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAccessConfigured()) {
    return NextResponse.json({ error: safeErrors.INVALID_CONFIGURATION.code, message: safeErrors.INVALID_CONFIGURATION.publicMessage }, { status: safeErrors.INVALID_CONFIGURATION.status });
  }
  try {
    const body = await request.json() as { token?: unknown };
    if (!isValidAdminAccessToken(body.token)) {
      return NextResponse.json({ error: safeErrors.UNAUTHORIZED.code, message: safeErrors.UNAUTHORIZED.publicMessage }, { status: safeErrors.UNAUTHORIZED.status });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), adminCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: safeErrors.INVALID_INPUT.code, message: safeErrors.INVALID_INPUT.publicMessage }, { status: safeErrors.INVALID_INPUT.status });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", adminLogoutCookieOptions());
  return response;
}
