import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { personService } from "@/lib/services/personService";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type PersonPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const record = await personService.getPublishedPersonBySlug(slug);
  if (!record) {
    return {
      title: "404",
      robots: { index: false, follow: false },
    };
  }

  const { person } = record;
  return {
    title: person.nameArabic,
    description: person.shortBio,
    alternates: { canonical: `/person/${person.slug}` },
    openGraph: {
      type: "profile",
      title: person.nameArabic,
      description: person.shortBio,
      url: `/person/${person.slug}`,
    },
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const record = await personService.getPublishedPersonBySlug(slug);
  if (!record) notFound();

  const copy = getMessages(defaultLocale);
  const { person, categories, timeline, education, sources } = record;
  const role = categories.map((category) => category.name).join(" · ") || person.occupations.join(" · ");
  const initials = person.nameArabic.slice(0, 2);

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
            <div className="profile-avatar avatar-teal" aria-hidden="true">
              {initials}
            </div>
            <div className="profile-heading">
              <span className="sample-pill">{copy.publishedProfileStatus}</span>
              <h1 id="profile-title">{person.nameArabic}</h1>
              <p className="profile-role">{role}</p>
              <p className="profile-meta">{person.shortBio}</p>
            </div>
            <div className="profile-status">
              <strong>{copy.publishedProfileStatus}</strong>
              <span>{sources.length} {copy.sourcesLabel}</span>
            </div>
          </section>

          <p className="profile-notice">{person.biography}</p>

          <div className="profile-layout">
            <section className="profile-main-column" aria-labelledby="profile-page-title">
              <p className="eyebrow">{copy.personPageTitle}</p>
              <h2 id="profile-page-title">{person.shortBio}</h2>
              <div className="profile-placeholder">
                <span className="placeholder-rule" aria-hidden="true" />
                <p>{timeline.length > 0 ? copy.timelineLabel : copy.notPublished}</p>
              </div>
            </section>
            <aside className="profile-sidebar" aria-label={copy.sourcesLabel}>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.timelineLabel}</p>
                <p>{timeline.length > 0 ? `${timeline.length}` : copy.notPublished}</p>
              </div>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.educationLabel}</p>
                <p>{education.length > 0 ? `${education.length}` : copy.notPublished}</p>
              </div>
              <div className="profile-side-block">
                <p className="eyebrow">{copy.sourcesLabel}</p>
                <p>{sources.length > 0 ? `${sources.length}` : copy.notPublished}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
