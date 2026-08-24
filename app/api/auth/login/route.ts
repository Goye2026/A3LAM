import { NextResponse } from "next/server";
import { createUserSession, findUserByEmail, updateLastSignedIn, USER_SESSION_COOKIE, userCookieOptions, verifyPassword } from "@/lib/user/auth";
import { UserInputError, parseLoginInput } from "@/lib/user/validation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return errorResponse("طلب غير مسموح", 403, "ORIGIN_MISMATCH");
  try {
    const input = parseLoginInput(await request.json());
    const account = await findUserByEmail(input.email);
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
      return errorResponse("البريد الإلكتروني أو كلمة المرور غير صحيحين", 401, "INVALID_CREDENTIALS");
    }
    await updateLastSignedIn(account.id);
    const session = await createUserSession(account.id);
    const response = NextResponse.json({ ok: true, user: { id: account.id, name: account.name, email: account.email, role: account.role } });
    response.cookies.set(USER_SESSION_COOKIE, session.token, userCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof UserInputError) return errorResponse(error.message, 400, "INVALID_INPUT");
    console.error("[UserAuth] login failed");
    return errorResponse("تعذر تسجيل الدخول حاليًا", 503, "DEPENDENCY_UNAVAILABLE");
  }
}
