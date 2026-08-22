import { FoundationLink } from "@/components/foundation/Primitives";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function NotFound() {
  const copy = getMessages(defaultLocale);

  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <div className="state-page" aria-labelledby="not-found-title">
          <p className="eyebrow">{copy.notFoundEyebrow}</p>
          <h1 id="not-found-title">{copy.notFoundTitle}</h1>
          <p className="hero-lede">{copy.notFoundDescription}</p>
          <FoundationLink className="button button-primary" href="/">
            {copy.notFoundAction}
          </FoundationLink>
        </div>
      </div>
    </main>
  );
}
