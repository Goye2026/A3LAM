import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function LaunchControlLoading() {
  const copy = getMessages(defaultLocale);
  return <div className="admin-route"><p className="admin-alert" role="status" aria-live="polite">{copy.adminLaunchLoading}</p></div>;
}
