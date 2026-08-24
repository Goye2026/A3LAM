import { NextResponse } from "next/server";
import { getUserFromRequest, revokeUserSession, USER_SESSION_COOKIE, userLogoutCookieOptions } from "@/lib/user/auth";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

function readToken(request: Request) {
  const value = request.headers.get("cookie") ?? "";
  const part = value.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${USER_SESSION_COOKIE}=`));
  if (!part) return null;
  try { return decodeURIComponent(part.slice(USER_SESSION_COOKIE.length + 1)); } catch { return null; }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "ORIGIN_MISMATCH", message: "طلب غير مسموح" }, { status: 403 });
  await getUserFromRequest(request);
  await revokeUserSession(readToken(request));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(USER_SESSION_COOKIE, "", userLogoutCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  return POST(request);
}
