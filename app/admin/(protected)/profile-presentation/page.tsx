import type { Metadata } from "next";
import { AdminSiteExperiencePage } from "@/components/a3lam/AdminSiteExperiencePage";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Profile presentation · A3LAM", robots: { index: false, follow: false } };

export default function AdminProfilePresentationPage() {
  return <AdminSiteExperiencePage resource="profile_presentation" title={getMessages(defaultLocale).adminProfilePresentationSettings} />;
}
