import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function Loading() {
  const copy = getMessages(defaultLocale);
  return (
    <main className="a3lam-page" aria-busy="true" aria-live="polite">
      <div className="a3lam-shell">
        <div className="loading-state">
          <span className="loading-mark" aria-hidden="true">أ</span>
          <p className="eyebrow">{copy.siteEyebrow}</p>
          <h1>{copy.searchLoading}</h1>
          <span className="loading-rule" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
