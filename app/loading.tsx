import { defaultLocale } from "@/lib/i18n/config";
import { getPublicErrorMessages } from "@/lib/i18n/public-error";

export default function Loading() {
  const copy = getPublicErrorMessages(defaultLocale);
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
