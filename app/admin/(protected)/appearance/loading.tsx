import { AdminLoadingState } from "@/components/a3lam/AdminDesignSystem";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminAppearanceLoading() {
  return <div className="admin-route"><AdminLoadingState label={getMessages(defaultLocale).adminAppearance} /></div>;
}
