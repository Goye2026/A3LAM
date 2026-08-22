import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { findDisplayPerson } from "@/lib/a3lam/catalog";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type PersonPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const person = findDisplayPerson(slug);
  if (person.id !== slug) notFound();

  const copy = getMessages(defaultLocale);

  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} />
        <div className="profile-page">
          <Link className="back-link" href="/#featured">
            <span aria-hidden="true">↙</span>
            {copy.backToDirectory}
          </Link>

          <section className="profile-hero" aria-labelledby="profile-title">
            <div className={`profile-avatar avatar-${person.tone}`} aria-hidden="true">
              {person.initials}
            </div>
            <div className="profile-heading">
              <span className="sample-pill">{copy.demoLabel}</span>
              <h1 id="profile-title">{person.name}</h1>
              <p className="profile-role">{person.role}</p>
              <p className="profile-meta">{person.meta}</p>
            </div>
            <div className="profile-status">
              <strong>{copy.profileStatus}</strong>
              <span>{copy.notPublished}</span>
            </div>
          </section>

          <p className="profile-notice">{copy.profileStatusNote}</p>

          <div className="profile-layout">
            <section className="profile-main-column" aria-labelledby="profile-page-title">
              <p className="eyebrow">{copy.personPageTitle}</p>
              <h2 id="profile-page-title">{copy.personPageLede}</h2>
              <div className="profile-placeholder">
                <span className="placeholder-rule" aria-hidden="true" />
                <p>{copy.notPublished}</p>
              </div>
            </section>
            <aside className="profile-sidebar" aria-label={copy.sourcesLabel}>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.timelineLabel}</p>
                <p>{copy.notPublished}</p>
              </div>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.educationLabel}</p>
                <p>{copy.notPublished}</p>
              </div>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.sourcesLabel}</p>
                <p>{copy.notPublished}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
