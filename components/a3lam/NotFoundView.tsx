import Link from "next/link";
import { SiteFooter } from "@/components/a3lam/SiteFooter";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function NotFoundView() {
  const copy = getMessages(defaultLocale);

  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} />
        <div className="state-page" aria-labelledby="not-found-title">
          <p className="eyebrow">{copy.notFoundEyebrow}</p>
          <h1 id="not-found-title">{copy.notFoundTitle}</h1>
          <p className="hero-lede">{copy.notFoundDescription}</p>
          <div className="state-actions">
            <Link className="button button-primary" href="/">
              {copy.notFoundAction}
            </Link>
            <Link className="button button-quiet" href="/search">
              {copy.navSearch}
            </Link>
            <Link className="button button-quiet" href="/categories">
              {copy.navCategories}
            </Link>
          </div>
        </div>
        <SiteFooter copy={copy} />
      </div>
    </main>
  );
}
