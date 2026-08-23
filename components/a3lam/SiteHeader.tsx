import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";

type HeaderSection = "home" | "people" | "categories" | "about" | "search" | "contact" | "privacy";

function isAboutSection(active: HeaderSection | undefined) {
  return active === "about" || active === "contact" || active === "privacy";
}

type SiteHeaderProps = {
  copy: FoundationMessages;
  active?: HeaderSection;
};

export function SiteHeader({ copy, active = "home" }: SiteHeaderProps) {
  const links = [
    { key: "home" as const, href: "/", label: copy.navHome },
    { key: "people" as const, href: "/search", label: copy.navPeople },
    { key: "categories" as const, href: "/categories", label: copy.navCategories },
    { key: "about" as const, href: "/about", label: copy.navAbout },
  ];

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
        {links.map((link) => (
          <Link
            className={`a3lam-nav-link${(active === link.key || (link.key === "about" && isAboutSection(active))) ? " is-active" : ""}`}
            href={link.href}
            key={link.key}
            aria-current={active === link.key || (link.key === "about" && isAboutSection(active)) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link className="a3lam-header-action" href="/search" aria-current={active === "search" ? "page" : undefined}>
        <span className="a3lam-search-glyph" aria-hidden="true">
          /
        </span>
        <span>{copy.navSearch}</span>
      </Link>
    </header>
  );
}
