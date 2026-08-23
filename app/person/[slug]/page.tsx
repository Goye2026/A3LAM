import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonCard } from "@/components/a3lam/PersonCard";
import { SiteFooter } from "@/components/a3lam/SiteFooter";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { toDisplayPeople } from "@/lib/a3lam/catalog";
import type { Person } from "@/lib/domain/a3lam";
import { personService } from "@/lib/services/personService";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type PersonPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

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
    robots: { index: true, follow: true },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

function relatedPeopleFor(person: Person, people: Person[]) {
  return people
    .filter((candidate) => candidate.id !== person.id && candidate.categoryIds.some((id) => person.categoryIds.includes(id)))
    .slice(0, 3);
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params;
  const record = await personService.getPublishedPersonBySlug(slug);
  if (!record) notFound();

  const copy = getMessages(defaultLocale);
  const { person, categories, timeline, education, sources } = record;
  let relatedPeople: Person[] = [];
  try {
    relatedPeople = relatedPeopleFor(person, await personService.listPublishedPeople());
  } catch {
    relatedPeople = [];
  }

  const role = categories.map((category) => category.name).join(" · ") || person.occupations.join(" · ");
  const initials = person.nameArabic.slice(0, 2);
  const relatedDisplayPeople = toDisplayPeople(relatedPeople, categories);
  const facts = [
    { label: copy.profileOccupation, value: person.occupations.join(" · ") || "—" },
    { label: copy.profileCategories, value: categories.map((category) => category.name).join(" · ") || "—" },
    { label: copy.sourcesLabel, value: String(sources.length) },
    { label: copy.profileLastUpdated, value: formatDate(person.updatedAt) },
  ];

  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} active="people" />
        <div className="profile-page">
          <nav className="breadcrumb" aria-label={copy.navPeople}>
            <Link href="/">{copy.navHome}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/search">{copy.navPeople}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{person.nameArabic}</span>
          </nav>

          <section className="profile-hero" aria-labelledby="profile-title">
            <div className="profile-avatar avatar-teal" aria-hidden="true">
              {initials}
            </div>
            <div className="profile-heading">
              <span className="status-badge status-published">{copy.publishedProfileStatus}</span>
              <h1 id="profile-title">{person.nameArabic}</h1>
              <p className="profile-role">{role}</p>
              <p className="profile-meta">{person.shortBio}</p>
              <div className="profile-category-links" aria-label={copy.profileRelatedCategories}>
                {categories.map((category) => (
                  <Link key={category.id} href={`/search?category=${encodeURIComponent(category.id)}`}>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="profile-status">
              <strong>{copy.publishedProfileStatus}</strong>
              <span>{sources.length} {copy.sourcesLabel}</span>
            </div>
          </section>

          <div className="profile-layout">
            <div className="profile-main-column">
              <section className="profile-section" aria-labelledby="overview-title">
                <p className="eyebrow">{copy.profileOverview}</p>
                <h2 id="overview-title">{person.shortBio}</h2>
                {person.biography ? <p className="profile-biography">{person.biography}</p> : <p className="empty-state">{copy.profileNoBiography}</p>}
              </section>

              <section className="profile-section" aria-labelledby="facts-title">
                <p className="eyebrow">{copy.profileFacts}</p>
                <h2 id="facts-title">{copy.profileFacts}</h2>
                <dl className="facts-grid">
                  {facts.map((fact) => (
                    <div className="fact-item" key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="profile-section" aria-labelledby="education-title">
                <div className="section-header-row">
                  <div>
                    <p className="eyebrow">{copy.educationLabel}</p>
                    <h2 id="education-title">{copy.educationLabel}</h2>
                  </div>
                  <span className="section-index">{String(education.length).padStart(2, "0")}</span>
                </div>
                {education.length > 0 ? (
                  <div className="education-list">
                    {education.map((item) => (
                      <article className="education-item" key={item.id}>
                        <span className="timeline-marker" aria-hidden="true" />
                        <div>
                          <h3>{item.institution}</h3>
                          <p className="education-field">{item.field} · {item.dateRange}</p>
                          {item.description ? <p>{item.description}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">{copy.profileNoEducation}</p>
                )}
              </section>

              <section className="profile-section" aria-labelledby="timeline-title">
                <div className="section-header-row">
                  <div>
                    <p className="eyebrow">{copy.timelineLabel}</p>
                    <h2 id="timeline-title">{copy.timelineLabel}</h2>
                  </div>
                  <span className="section-index">{String(timeline.length).padStart(2, "0")}</span>
                </div>
                {timeline.length > 0 ? (
                  <div className="timeline-list">
                    {timeline.map((event) => (
                      <article className="timeline-item" key={event.id}>
                        <div className="timeline-date">{event.date}</div>
                        <div className="timeline-content">
                          <span className="timeline-marker" aria-hidden="true" />
                          <h3>{event.title}</h3>
                          <p>{event.description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">{copy.profileNoTimeline}</p>
                )}
              </section>

              <section className="profile-section" aria-labelledby="sources-title">
                <div className="section-header-row">
                  <div>
                    <p className="eyebrow">{copy.sourcesLabel}</p>
                    <h2 id="sources-title">{copy.sourcesLabel}</h2>
                  </div>
                  <span className="section-index">{String(sources.length).padStart(2, "0")}</span>
                </div>
                {sources.length > 0 ? (
                  <div className="source-list">
                    {sources.map((source) => (
                      <article className="source-item" key={source.id}>
                        <div>
                          <p className="source-type">{source.type}</p>
                          <h3>{source.title}</h3>
                          <p>{source.publisher}{source.publicationDate ? ` · ${source.publicationDate}` : ""}</p>
                        </div>
                        <a href={source.url} target="_blank" rel="noreferrer" aria-label={`${copy.profileSourceAccess}: ${source.title}`}>
                          {copy.profileSourceAccess} <span aria-hidden="true">↗</span>
                        </a>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">{copy.profileNoSources}</p>
                )}
              </section>
            </div>

            <aside className="profile-sidebar" aria-label={copy.profileFacts}>
              <div className="profile-sidebar-intro">
                <span className="eyebrow">{copy.profileStatus}</span>
                <p>{copy.personPageLede}</p>
              </div>
              {facts.map((fact) => (
                <div className="profile-side-block" key={`side-${fact.label}`}>
                  <p className="eyebrow">{fact.label}</p>
                  <p>{fact.value}</p>
                </div>
              ))}
            </aside>
          </div>

          {relatedDisplayPeople.length > 0 ? (
            <section className="profile-related" aria-labelledby="related-title">
              <div className="section-header-row">
                <div>
                  <p className="eyebrow">{copy.profileRelatedPeople}</p>
                  <h2 id="related-title">{copy.profileRelatedPeople}</h2>
                </div>
                <Link className="text-link" href="/search">
                  {copy.searchAction} <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="people-grid">
                {relatedDisplayPeople.map((relatedPerson) => (
                  <PersonCard key={relatedPerson.id} person={relatedPerson} copy={copy} />
                ))}
              </div>
            </section>
          ) : null}

          <Link className="back-link profile-back-link" href="/search">
            <span aria-hidden="true">↙</span>
            {copy.backToDirectory}
          </Link>
        </div>
        <SiteFooter copy={copy} />
      </div>
    </main>
  );
}
