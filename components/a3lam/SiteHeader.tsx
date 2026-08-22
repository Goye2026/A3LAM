import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";

type SiteHeaderProps = {
  copy: FoundationMessages;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  return (
    <header className="a3lam-header">
      <Link className="a3lam-brand" href="/" aria-label={`${copy.siteName} — ${copy.navHome}`}>
        <span className="a3lam-brand-mark" aria-hidden="true">
          أ
        </span>
        <span className="a3lam-brand-copy">
          <span className="a3lam-brand-name">{copy.siteName}</span>
          <span className="a3lam-brand-eyebrow">{copy.siteEyebrow}</span>
        </span>
      </Link>

      <nav className="a3lam-nav" aria-label={copy.siteName}>
        <Link className="a3lam-nav-link is-active" href="#top">
          {copy.navHome}
        </Link>
        <Link className="a3lam-nav-link" href="#featured">
          {copy.navPeople}
        </Link>
        <Link className="a3lam-nav-link" href="#categories">
          {copy.navCategories}
        </Link>
        <Link className="a3lam-nav-link" href="#about">
          {copy.navAbout}
        </Link>
      </nav>

      <Link className="a3lam-header-action" href="#search">
        <span className="a3lam-search-glyph" aria-hidden="true">
          /
        </span>
        <span>{copy.searchAction}</span>
      </Link>
    </header>
  );
}
