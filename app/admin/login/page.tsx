import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/a3lam/AdminLoginForm";
import { isAdminAccessConfigured } from "@/lib/admin/auth";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Editorial sign-in | A3LAM",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ next?: string }> };

function safeNext(value: string | undefined) {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const copy = getMessages(defaultLocale);
  const params = await searchParams;
  if (!isAdminAccessConfigured()) {
    return (
      <main className="a3lam-page admin-login-page">
        <div className="a3lam-shell admin-login-shell">
          <div className="admin-login-card" role="alert">
            <p className="eyebrow">{copy.adminTitle}</p>
            <h1>{copy.adminLoginTitle}</h1>
            <p className="route-description">{copy.adminAccessUnavailable}</p>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="a3lam-page admin-login-page">
      <div className="a3lam-shell admin-login-shell">
        <div className="admin-login-card">
          <p className="eyebrow">{copy.adminTitle}</p>
          <h1>{copy.adminLoginTitle}</h1>
          <p className="route-description">{copy.adminLoginDescription}</p>
          <AdminLoginForm
            copy={{ adminAccessToken: copy.adminAccessToken, adminLoginAction: copy.adminLoginAction, adminInvalidAccess: copy.adminInvalidAccess, adminAccessUnavailable: copy.adminAccessUnavailable, adminSaving: copy.adminSaving }}
            nextPath={safeNext(params.next)}
          />
        </div>
      </div>
    </main>
  );
}
