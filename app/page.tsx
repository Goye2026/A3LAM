import { CategoryCard } from "@/components/a3lam/CategoryCard";
import { PersonCard } from "@/components/a3lam/PersonCard";
import { SearchDiscovery } from "@/components/a3lam/SearchDiscovery";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { displayCategories, displayPeople } from "@/lib/a3lam/catalog";
import { personService } from "@/lib/services/personService";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

const stats = [
  { value: "01", labelKey: "statsPeople" },
  { value: "07", labelKey: "statsCategories" },
  { value: "∞", labelKey: "statsCountries" },
] as const;

export default function HomePage() {
  const copy = getMessages(defaultLocale);

  return (
    <main id="top" className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} />

        <section className="a3lam-hero" aria-labelledby="hero-title">
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="hero-seal">
              <span>أ</span>
              <small>A3LAM</small>
            </div>
            <span className="hero-coordinate coordinate-one">16° N</span>
            <span className="hero-coordinate coordinate-two">YEMEN / 01</span>
          </div>
          <div className="hero-content">
            <p className="eyebrow">{copy.heroEyebrow}</p>
            <h1 id="hero-title">{copy.heroTitle}</h1>
            <p className="hero-lede">{copy.heroLede}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#featured">
                {copy.heroCta}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="button button-quiet" href="#about">
                {copy.heroSecondary}
              </a>
            </div>
            <div className="hero-note-line">
              <span className="note-dot" aria-hidden="true" />
              <span>{copy.scopeDescription}</span>
            </div>
          </div>
        </section>

        <section className="stats-strip" aria-label={copy.phaseStatus}>
          {stats.map((stat) => (
            <div className="stat-item" key={stat.value}>
              <strong>{stat.value}</strong>
              <span>{copy[stat.labelKey]}</span>
            </div>
          ))}
          <div className="stat-source">
            <span className="stat-source-line" aria-hidden="true" />
            <span>{copy.demoDataNote}</span>
          </div>
        </section>

        <SearchDiscovery copy={copy} categories={personService.listCategories()} />

        <section className="section-block" id="featured" aria-labelledby="featured-title">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">{copy.featuredEyebrow}</p>
              <h2 id="featured-title">{copy.featuredTitle}</h2>
            </div>
            <a className="text-link" href="#categories">
              {copy.viewAll} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="section-description">{copy.featuredDescription}</p>
          <div className="people-grid">
            {displayPeople.map((person) => (
              <PersonCard key={person.id} person={person} copy={copy} />
            ))}
          </div>
        </section>

        <section className="section-block categories-section" id="categories" aria-labelledby="categories-title">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">{copy.categoriesEyebrow}</p>
              <h2 id="categories-title">{copy.categoriesTitle}</h2>
            </div>
            <span className="section-index" aria-hidden="true">02 / 03</span>
          </div>
          <p className="section-description">{copy.categoriesDescription}</p>
          <div className="category-grid">
            {displayCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        <section className="editorial-band" id="about" aria-labelledby="cta-title">
          <div className="editorial-mark" aria-hidden="true">“</div>
          <div>
            <p className="eyebrow">{copy.ctaEyebrow}</p>
            <h2 id="cta-title">{copy.ctaTitle}</h2>
            <p>{copy.ctaDescription}</p>
          </div>
          <a className="button button-light" href="#search">
            {copy.ctaAction}
            <span aria-hidden="true">↗</span>
          </a>
        </section>

        <footer className="a3lam-footer">
          <div className="footer-brand">
            <span className="footer-mark" aria-hidden="true">أ</span>
            <div>
              <strong>{copy.siteName}</strong>
              <p>{copy.footerTagline}</p>
            </div>
          </div>
          <div className="footer-links" aria-label={copy.siteName}>
            <a href="#featured">{copy.footerExplore}</a>
            <a href="#about">{copy.footerContribute}</a>
            <a href="#top">{copy.footerAbout}</a>
          </div>
          <div className="footer-meta">
            <span>{copy.footerRights}</span>
            <span>{copy.footerNote}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
