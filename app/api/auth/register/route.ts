import { NextResponse } from "next/server";
import { createUserAccount, createUserSession, findUserByEmail, USER_SESSION_COOKIE, userCookieOptions } from "@/lib/user/auth";
import { UserInputError, parseRegistrationInput } from "@/lib/user/validation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return errorResponse("طلب غير مسموح", 403, "ORIGIN_MISMATCH");
  try {
    const input = parseRegistrationInput(await request.json());
    if (await findUserByEmail(input.email)) return errorResponse("هذا البريد الإلكتروني مستخدم بالفعل", 409, "EMAIL_IN_USE");
    const user = await createUserAccount(input.name, input.email, input.password);
    if (!user) return errorResponse("تعذر إنشاء الحساب حاليًا", 503, "DEPENDENCY_UNAVAILABLE");
    const session = await createUserSession(user.id);
    const response = NextResponse.json({ ok: true, user }, { status: 201 });
    response.cookies.set(USER_SESSION_COOKIE, session.token, userCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof UserInputError) return errorResponse(error.message, 400, "INVALID_INPUT");
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505") {
      return errorResponse("هذا البريد الإلكتروني مستخدم بالفعل", 409, "EMAIL_IN_USE");
    }
    console.error("[UserAuth] registration failed");
    return errorResponse("تعذر إنشاء الحساب حاليًا", 503, "DEPENDENCY_UNAVAILABLE");
  }
}
