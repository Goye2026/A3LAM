import Link from "next/link";
import { SiteFrame } from "./SiteFrame";
import type { PublicMessages } from "@/lib/i18n/messages";

export type InfoPageProps = {
  copy: PublicMessages;
  title: string;
  description: string;
  active?: "about" | "home" | "contact" | "privacy";
};

export async function InfoPage({ copy, title, description, active = "about" }: InfoPageProps) {
  return (
    <SiteFrame copy={copy} active={active} template="single-page">
      <main className="route-page info-page">
          <Link className="back-link" href="/categories">
            <span aria-hidden="true">↙</span>
            {copy.backToDirectory}
          </Link>
          <section className="info-panel" aria-labelledby="info-title">
            <div className="info-panel-main">
              <p className="eyebrow">{copy.siteEyebrow}</p>
              <h1 id="info-title">{title}</h1>
              <p className="route-description">{description}</p>
            </div>
            <aside className="info-panel-next" aria-labelledby="info-next-title">
              <p className="eyebrow">{copy.infoPageNextEyebrow}</p>
              <h2 id="info-next-title">{copy.infoPageNextTitle}</h2>
              <p>{copy.infoPageNextDescription}</p>
              <div className="info-panel-actions">
                <Link className="button button-primary" href="/search">
                  {copy.infoPageNextAction}
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link className="button button-quiet" href="/categories">
                  {copy.navCategories}
                </Link>
              </div>
            </aside>
          </section>
      </main>
    </SiteFrame>
  );
}
