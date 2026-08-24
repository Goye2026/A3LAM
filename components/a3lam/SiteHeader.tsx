import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { getCurrentUser } from "@/lib/user/auth";
import { LogoutButton } from "./LogoutButton";

type HeaderSection = "home" | "people" | "categories" | "about" | "search" | "contact" | "privacy";

function isAboutSection(active: HeaderSection | undefined) {
  return active === "about" || active === "contact" || active === "privacy";
}

type SiteHeaderProps = {
  copy: FoundationMessages;
  active?: HeaderSection;
};

export async function SiteHeader({ copy, active = "home" }: SiteHeaderProps) {
  const user = await getCurrentUser();
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
        {links.map((link) => {
          const isActive = active === link.key || (link.key === "about" && isAboutSection(active));
          return (
            <Link
              className={`a3lam-nav-link${isActive ? " is-active" : ""}`}
              href={link.href}
              key={link.key}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="a3lam-header-actions">
        <Link className="a3lam-header-action" href="/search" aria-current={active === "search" ? "page" : undefined}>
          <span className="a3lam-search-glyph" aria-hidden="true">/</span>
          <span>{copy.navSearch}</span>
        </Link>
        {user ? (
          <>
            <Link className="a3lam-header-account" href="/account">{copy.navMyProfile}</Link>
            <LogoutButton label={copy.navLogout} busyLabel={copy.navSigningOut} />
          </>
        ) : (
          <>
            <Link className="a3lam-header-profile" href="/profile/new">{copy.navCreateProfile}</Link>
            <Link className="a3lam-header-account" href="/login">{copy.navLogin}</Link>
          </>
        )}
      </div>
    </header>
  );
}
