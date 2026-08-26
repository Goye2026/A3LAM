"use client";

import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";

export default function AdminAiError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void _error;
  const copy = getMessages(defaultLocale);
  return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p><button type="button" className="button button-quiet" onClick={reset}>{copy.retryAction}</button></div>;
}
