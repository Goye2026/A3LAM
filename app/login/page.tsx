import type { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "@/components/a3lam/UserAuthForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول إلى حسابك في أعلام.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-card">
        <Link className="auth-brand" href="/">أعلام</Link>
        <p className="eyebrow">مساحتك المهنية</p>
        <h1>تسجيل الدخول</h1>
        <p className="route-description">أدخل بيانات حسابك للوصول إلى ملفك المهني وإدارته.</p>
        <UserAuthForm
          mode="login"
          copy={{
            name: "الاسم",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            confirmation: "تأكيد كلمة المرور",
            submit: "تسجيل الدخول",
            submitting: "جارٍ تسجيل الدخول…",
            switchPrompt: "ليس لديك حساب؟",
            switchLabel: "إنشاء حساب",
            invalid: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
          }}
        />
      </div>
    </main>
  );
}
