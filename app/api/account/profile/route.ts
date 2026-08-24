import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user/auth";
import { getProfileForUser, saveUserProfile } from "@/lib/user/profileRepository";
import { parseProfileInput, ProfileInputError, validateProfileForPublication } from "@/lib/user/profileValidation";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "يجب تسجيل الدخول أولًا" }, { status: 401 });
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return unauthorized();
  const profile = await getProfileForUser(user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "طلب غير مسموح" }, { status: 403 });
  const user = await getUserFromRequest(request);
  if (!user) return unauthorized();
  try {
    const body = await request.json() as { action?: "save" | "submit"; profile?: unknown };
    const input = parseProfileInput(body.profile ?? body);
    const action = body.action ?? "save";
    if (action !== "save" && action !== "submit") return NextResponse.json({ message: "إجراء غير صالح" }, { status: 400 });
    if (action === "submit") {
      const issues = validateProfileForPublication(input);
      if (issues.length > 0) return NextResponse.json({ message: "لا يمكن إرسال الملف قبل استكمال المتطلبات", issues }, { status: 422 });
    }
    const profile = await saveUserProfile(user.id, input, action === "submit" ? "pending_review" : "draft");
    return NextResponse.json({ profile }, { status: action === "submit" ? 202 : 200 });
  } catch (error) {
    if (error instanceof ProfileInputError) return NextResponse.json({ message: error.message }, { status: 400 });
    if (error instanceof Error && ["Profile slug is already in use", "Profile slug cannot be changed", "Invalid profile source", "Unknown profile category"].includes(error.message)) return NextResponse.json({ message: "تعذر حفظ الملف: تحقق من الرابط والتصنيف والمصدر" }, { status: 409 });
    console.error("profile_save_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ message: "تعذر حفظ الملف حاليًا" }, { status: 500 });
  }
}
