import type { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "@/components/a3lam/UserAuthForm";
import { getSafeAuthDestination } from "@/lib/user/redirect";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابًا لإدارة ملفك المهني في أعلام.",
  robots: { index: false, follow: false },
};

type RegisterPageProps = { searchParams?: Promise<{ next?: string }> };

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const redirectTo = getSafeAuthDestination(params.next, "/account?welcome=1");

  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-card">
        <Link className="auth-brand" href="/">أعلام</Link>
        <p className="eyebrow">ملفك المهني العربي</p>
        <h1>إنشاء حساب</h1>
        <p className="route-description">أنشئ حسابًا منفصلًا عن مساحة التحرير لإنشاء سيرتك المهنية وإرسالها للمراجعة.</p>
        <UserAuthForm
          mode="register"
          redirectTo={redirectTo}
          copy={{
            name: "الاسم",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            confirmation: "تأكيد كلمة المرور",
            submit: "إنشاء الحساب",
            submitting: "جارٍ إنشاء الحساب…",
            switchPrompt: "لديك حساب بالفعل؟",
            switchLabel: "تسجيل الدخول",
            invalid: "تعذر إنشاء الحساب. حاول مرة أخرى.",
          }}
        />
      </div>
    </main>
  );
}
