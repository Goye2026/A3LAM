import Link from "next/link";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { withTimeout } from "@/lib/foundation/withTimeout";
import { siteExperienceDefaults } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

type SiteFooterProps = { copy: FoundationMessages };

export async function SiteFooter({ copy }: SiteFooterProps) {
  const footer = await withTimeout(siteExperienceRepository.getPublishedResource("footer"), 2500).catch(() => siteExperienceDefaults.footer);
  const navigation = await withTimeout(siteExperienceRepository.getPublishedResource("navigation"), 2500).catch(() => siteExperienceDefaults.navigation);
  const identity = await withTimeout(siteExperienceRepository.getPublishedResource("identity"), 2500).catch(() => siteExperienceDefaults.identity);
  const links = footer.groups.length > 0 ? footer.groups.flatMap((group) => group.links).filter((link) => link.visible).sort((a, b) => a.order - b.order) : navigation.footer.filter((link) => link.visible).sort((a, b) => a.order - b.order);
  const legalLinks = footer.legalLinks.filter((link) => link.visible).sort((a, b) => a.order - b.order);

  return <footer className="a3lam-footer">
    <div className="footer-brand"><span className="footer-mark" aria-hidden="true">أ</span><div><strong>{identity.siteName || copy.siteName}</strong><p>{footer.description || identity.tagline || copy.footerTagline}</p></div></div>
    <nav className="footer-links" aria-label={copy.siteName}>{links.map((link) => <Link href={link.href} key={link.id} {...(link.kind === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}</Link>)}{legalLinks.map((link) => <Link href={link.href} key={`legal-${link.id}`} {...(link.kind === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}</Link>)}{footer.contactHref ? <Link href={footer.contactHref}>{copy.footerContact}</Link> : null}</nav>
    {footer.socialLinks.length > 0 ? <div className="footer-social-links" aria-label={copy.footerContact}>{footer.socialLinks.map((link) => <a href={link.url} key={link.platform} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</div> : null}
    <div className="footer-meta"><span>{footer.copyright || copy.footerRights}</span><span>{copy.footerNote}</span></div>
  </footer>;
}
