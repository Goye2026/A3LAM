import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";

type SiteFooterProps = {
  copy: FoundationMessages;
};

export function SiteFooter({ copy }: SiteFooterProps) {
  return (
    <footer className="a3lam-footer">
      <div className="footer-brand">
        <span className="footer-mark" aria-hidden="true">أ</span>
        <div>
          <strong>{copy.siteName}</strong>
          <p>{copy.footerTagline}</p>
        </div>
      </div>
      <nav className="footer-links" aria-label={copy.siteName}>
        <Link href="/search">{copy.footerExplore}</Link>
        <Link href="/categories">{copy.navCategories}</Link>
        <Link href="/profile/new">{copy.homeCreateProfile}</Link>
        <Link href="/about">{copy.footerAbout}</Link>
        <Link href="/contact">{copy.footerContact}</Link>
        <Link href="/privacy">{copy.footerPrivacy}</Link>
      </nav>
      <div className="footer-meta">
        <span>{copy.footerRights}</span>
        <span>{copy.footerNote}</span>
      </div>
    </footer>
  );
}
