import { AdminLoadingState } from "@/components/a3lam/AdminDesignSystem";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminContentLoading() {
  return <div className="admin-route"><AdminLoadingState label={getMessages(defaultLocale).adminCmsEditor} /></div>;
}
