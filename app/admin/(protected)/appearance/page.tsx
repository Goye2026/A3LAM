import type { Metadata } from "next";
import { AdminSiteExperiencePage } from "@/components/a3lam/AdminSiteExperiencePage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Appearance · A3LAM", robots: { index: false, follow: false } };

export default function AdminAppearancePage() {
  return <AdminSiteExperiencePage resource="appearance" title={getMessages(defaultLocale).adminAppearance} />;
}
