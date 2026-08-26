import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminAiLoading() {
  const copy = getMessages(defaultLocale);
  return <div className="admin-route" aria-busy="true"><p className="admin-alert" role="status">{copy.adminAiDocumentProcessing}…</p></div>;
}
