import type { Metadata } from "next";
import { LogoutPageClient } from "@/components/a3lam/LogoutPageClient";

export const metadata: Metadata = { title: "تسجيل الخروج", robots: { index: false, follow: false } };

export default function LogoutPage() {
  return <main className="auth-page" dir="rtl"><div className="auth-card"><h1>تسجيل الخروج</h1><LogoutPageClient /></div></main>;
}
