import Link from "next/link";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { FoundationMessages } from "@/lib/i18n/messages";

export type InfoPageProps = {
  copy: FoundationMessages;
  title: string;
  description: string;
  active?: "about" | "home";
};

export function InfoPage({ copy, title, description, active = "about" }: InfoPageProps) {
  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} active={active} />
        <div className="route-page info-page">
          <Link className="back-link" href="/">
            <span aria-hidden="true">↙</span>
            {copy.backToDirectory}
          </Link>
          <section className="info-panel" aria-labelledby="info-title">
            <p className="eyebrow">{copy.siteEyebrow}</p>
            <h1 id="info-title">{title}</h1>
            <p className="route-description">{description}</p>
          </section>
        </div>
        <SiteFooter copy={copy} />
      </div>
    </main>
  );
}
