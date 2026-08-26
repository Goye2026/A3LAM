import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryCard } from "@/components/a3lam/CategoryCard";
import { HomepageDiscovery } from "@/components/a3lam/HomepageDiscovery";
import { HomepageTrust } from "@/components/a3lam/HomepageTrust";
import { PersonCard } from "@/components/a3lam/PersonCard";
import { SearchDiscovery } from "@/components/a3lam/SearchDiscovery";
import { SiteFooter } from "@/components/a3lam/SiteFooter";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { toDisplayCategories, toDisplayPeople } from "@/lib/a3lam/catalog";
import type { Category, Person } from "@/lib/domain/a3lam";
import type { HomepageSettings } from "@/lib/site-experience/config";
import { defaultLocale } from "@/lib/i18n/config";
import { getPublicMessages, type PublicMessages } from "@/lib/i18n/messages";
import { withTimeout } from "@/lib/foundation/withTimeout";
import { personService } from "@/lib/services/personService";
import { siteExperienceDefaults, type HomepageSettings as HomepageConfig } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const HOMEPAGE_DATA_TIMEOUT_MS = 5000;

type HomepageCopy = PublicMessages & {
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  homeCreateProfile: string;
  homeExplore: string;
  searchHint: string;
  searchPlaceholder: string;
  searchHelperText: string;
  featuredTitle: string;
  featuredDescription: string;
  categoriesTitle: string;
  categoriesDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaAction: string;
};

type CatalogSectionsProps = {
  homepage: HomepageConfig;
  copy: PublicMessages;
  publicCopy: PublicMessages;
  homepageCopy: HomepageCopy;
};

function isVisible(homepage: HomepageConfig, key: HomepageSettings["sections"][number]["key"]) {
  return homepage.sections.find((section) => section.key === key)?.visible ?? true;
}

function buildHomepageCopy(homepage: HomepageConfig, copy: PublicMessages, publicCopy: PublicMessages): HomepageCopy {
  return {
    ...publicCopy,
    heroEyebrow: homepage.hero.eyebrow || copy.heroEyebrow,
    heroTitle: homepage.hero.title || copy.heroTitle,
    heroLede: homepage.hero.subtitle || copy.heroLede,
    homeCreateProfile: homepage.hero.primary.label || copy.homeCreateProfile,
    homeExplore: homepage.hero.secondary.label || copy.homeExplore,
    searchHint: homepage.search.title || copy.searchHint,
    searchPlaceholder: homepage.search.placeholder || copy.searchPlaceholder,
    searchHelperText: homepage.search.helperText || copy.searchNoResultsHint,
    featuredTitle: homepage.featured.sectionTitle || copy.featuredTitle,
    featuredDescription: homepage.featured.sectionDescription || copy.featuredDescription,
    categoriesTitle: homepage.categories.title || copy.categoriesTitle,
    categoriesDescription: homepage.categories.description || copy.categoriesDescription,
    ctaTitle: homepage.finalCta.title || copy.ctaTitle,
    ctaDescription: homepage.finalCta.description || copy.ctaDescription,
    ctaAction: homepage.finalCta.button.label || copy.ctaAction,
  };
}

function EmptyCatalogState({ message, alert = false }: { message: string; alert?: boolean }) {
  return (
    <div className="empty-state" role={alert ? "alert" : "status"}>
      <span className="empty-state-mark" aria-hidden="true">—</span>
      <p>{message}</p>
    </div>
  );
}

function CatalogStats({ copy, peopleCount = null, categoriesCount = null, unavailable = false }: { copy: PublicMessages; peopleCount?: number | null; categoriesCount?: number | null; unavailable?: boolean }) {
  const stats = [
    { value: unavailable || peopleCount === null ? "—" : String(peopleCount).padStart(2, "0"), label: copy.statsPeople },
    { value: unavailable || categoriesCount === null ? "—" : String(categoriesCount).padStart(2, "0"), label: copy.statsCategories },
    { value: "—", label: copy.statsCountries },
  ];

  return (
    <section className="stats-strip" aria-label={copy.phaseStatus}>
      {stats.map((stat) => (
        <div className="stat-item" key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
      <div className="stat-source">
        <span className="stat-source-line" aria-hidden="true" />
        <span>{unavailable ? copy.dataUnavailable : copy.publishedDataNote}</span>
      </div>
    </section>
  );
}

async function HomepageCatalogSections({ homepage, copy, publicCopy, homepageCopy }: CatalogSectionsProps) {
  let categories: Category[] = [];
  let people: Person[] = [];
  let dataUnavailable = false;

  try {
    [categories, people] = await withTimeout(
      Promise.all([
        personService.listCategories(),
        personService.listPublishedPeople(),
      ]),
      HOMEPAGE_DATA_TIMEOUT_MS,
    );
  } catch {
    dataUnavailable = true;
  }

  const displayCategories = toDisplayCategories(categories).slice(0, homepage.categories.itemLimit);
  const displayPeopleAll = toDisplayPeople(people, categories);
  const displayPeople = homepage.featured.selectionMode === "selected" && homepage.featured.selectedPersonIds.length > 0 ? displayPeopleAll.filter((person) => homepage.featured.selectedPersonIds.includes(person.id)) : displayPeopleAll.slice(0, 6);

  return (
    <div className="homepage-catalog-stream">
      <CatalogStats copy={copy} peopleCount={people.length} categoriesCount={categories.length} unavailable={dataUnavailable} />
      {isVisible(homepage, "search") ? <SearchDiscovery copy={homepageCopy} categories={categories} helperText={homepageCopy.searchHelperText} /> : null}
      {isVisible(homepage, "featured") ? (
        <section className="section-block featured-section" id="featured" aria-labelledby="featured-title">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">{homepageCopy.featuredEyebrow}</p>
              <h2 id="featured-title">{homepageCopy.featuredTitle}</h2>
            </div>
            <Link className="text-link" href="/search">
              {copy.viewAll} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="section-description">{homepageCopy.featuredDescription}</p>
          {displayPeople.length > 0 ? (
            <div className="people-grid">
              {displayPeople.map((person) => <PersonCard key={person.id} person={person} copy={publicCopy} />)}
            </div>
          ) : (
            <EmptyCatalogState message={dataUnavailable ? copy.dataUnavailable : copy.featuredEmpty} alert={dataUnavailable} />
          )}
        </section>
      ) : null}
      {isVisible(homepage, "categories") ? (
        <>
          <section className="section-block categories-section" id="categories" aria-labelledby="categories-title">
            <div className="section-header-row">
              <div>
                <p className="eyebrow">{homepageCopy.categoriesEyebrow}</p>
                <h2 id="categories-title">{homepageCopy.categoriesTitle}</h2>
              </div>
              <span className="section-index" aria-hidden="true">02 / 03</span>
            </div>
            <p className="section-description">{homepageCopy.categoriesDescription}</p>
            {displayCategories.length > 0 ? (
              <div className={`category-grid category-grid-${homepage.categories.displayMode}`}>
                {displayCategories.map((category) => <CategoryCard key={category.id} category={category} />)}
              </div>
            ) : (
              <EmptyCatalogState message={dataUnavailable ? copy.dataUnavailable : copy.categoryNoPeople} alert={dataUnavailable} />
            )}
          </section>
          <HomepageDiscovery copy={publicCopy} />
        </>
      ) : null}
    </div>
  );
}

function HomepageCatalogFallback({ homepage, copy, homepageCopy }: Pick<CatalogSectionsProps, "homepage" | "copy" | "homepageCopy">) {
  return (
    <div className="homepage-catalog-stream">
      <CatalogStats copy={copy} unavailable />
      {isVisible(homepage, "search") ? <SearchDiscovery copy={homepageCopy} categories={[]} helperText={homepageCopy.searchHelperText} /> : null}
      {isVisible(homepage, "featured") ? (
        <section className="section-block featured-section" aria-labelledby="featured-fallback-title">
          <div className="section-header-row"><div><p className="eyebrow">{homepageCopy.featuredEyebrow}</p><h2 id="featured-fallback-title">{homepageCopy.featuredTitle}</h2></div></div>
          <EmptyCatalogState message={copy.dataUnavailable} alert />
        </section>
      ) : null}
      {isVisible(homepage, "categories") ? (
        <section className="section-block categories-section" aria-labelledby="categories-fallback-title">
          <div className="section-header-row"><div><p className="eyebrow">{homepageCopy.categoriesEyebrow}</p><h2 id="categories-fallback-title">{homepageCopy.categoriesTitle}</h2></div></div>
          <EmptyCatalogState message={copy.dataUnavailable} alert />
        </section>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const publicCopy = getPublicMessages(defaultLocale);
  const copy = publicCopy;
  const homepage = await withTimeout(siteExperienceRepository.getPublishedResource("homepage"), 3000).catch(() => siteExperienceDefaults.homepage);
  const homepageCopy = buildHomepageCopy(homepage, copy, publicCopy);

  return (
    <main id="top" className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={homepageCopy} active="home" />

        {isVisible(homepage, "hero") ? (
          <section className="a3lam-hero" aria-labelledby="hero-title">
            <div className="hero-content">
              <div className="hero-kicker-row">
                <p className="eyebrow">{homepageCopy.heroEyebrow}</p>
                <span className="hero-index" aria-hidden="true">01 / 03</span>
              </div>
              <p className="hero-audience">{homepageCopy.homeAudience}</p>
              <h1 id="hero-title">
                <span className="hero-title-lead">أعلام</span>
                <span>{homepageCopy.heroTitle.replace(/^أعلام\s*[—–-]?\s*/, "").trim()}</span>
              </h1>
              <p className="hero-lede">{homepageCopy.heroLede}</p>
              <div className="hero-actions">
                <a className="button button-primary" href={homepage.hero.secondary.href}>{homepageCopy.homeExplore}<span aria-hidden="true">↗</span></a>
                <a className="button button-quiet" href={homepage.hero.primary.href}>{homepageCopy.homeCreateProfile}</a>
              </div>
              <div className="hero-note-line"><span className="note-dot" aria-hidden="true" /><span>{homepageCopy.scopeDescription}</span></div>
            </div>
            <div className={`hero-visual${homepage.hero.imageUrl ? " hero-visual-image" : ""}`} aria-hidden="true">
              {homepage.hero.imageUrl ? <span className="hero-visual-image-layer" style={{ backgroundImage: `url(${homepage.hero.imageUrl})` }} /> : null}
              <div className="hero-visual-overlay" />
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <div className="hero-seal"><span>أ</span><small>A3LAM</small></div>
              <span className="hero-coordinate coordinate-one">16° N</span>
              <span className="hero-coordinate coordinate-two">YEMEN / 01</span>
              <span className="hero-visual-caption">{copy.publishedDataNote}</span>
            </div>
          </section>
        ) : null}

        <Suspense fallback={<HomepageCatalogFallback homepage={homepage} copy={copy} homepageCopy={homepageCopy} />}>
          <HomepageCatalogSections homepage={homepage} copy={copy} publicCopy={publicCopy} homepageCopy={homepageCopy} />
        </Suspense>

        {isVisible(homepage, "about") && homepage.about.visible ? <HomepageTrust copy={publicCopy} /> : null}

        {isVisible(homepage, "profiles") && homepage.profiles.visible ? (
          <section className="editorial-band editorial-band-profile" id="profiles" aria-labelledby="profiles-title">
            <div className="editorial-mark" aria-hidden="true">+</div>
            <div><p className="eyebrow">{homepageCopy.homeAudience}</p><h2 id="profiles-title">{homepage.profiles.title}</h2><p>{homepage.profiles.description}</p></div>
            <a className="button button-light" href={homepage.profiles.cta.href}>{homepage.profiles.cta.label}<span aria-hidden="true">↗</span></a>
          </section>
        ) : null}

        {isVisible(homepage, "final_cta") ? (
          <section className="editorial-band editorial-band-contribute" id="contribute" aria-labelledby="cta-title">
            <div className="editorial-mark" aria-hidden="true">“</div>
            <div><p className="eyebrow">{homepageCopy.ctaEyebrow}</p><h2 id="cta-title">{homepageCopy.ctaTitle}</h2><p>{homepageCopy.ctaDescription}</p></div>
            <a className="button button-light" href={homepage.finalCta.button.href}>{homepageCopy.ctaAction}<span aria-hidden="true">↗</span></a>
          </section>
        ) : null}

        <SiteFooter copy={publicCopy} />
      </div>
    </main>
  );
}
