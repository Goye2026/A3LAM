import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonCard } from "@/components/a3lam/PersonCard";
import { ProfessionalProfileCard } from "@/components/a3lam/ProfessionalProfileCard";
import { SiteFooter } from "@/components/a3lam/SiteFooter";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import { toDisplayPeople } from "@/lib/a3lam/catalog";
import type { Category, Person } from "@/lib/domain/a3lam";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { personService } from "@/lib/services/personService";
import { searchPublicProfiles, type PublicProfile } from "@/lib/user/profileRepository";
import { pageMetadata } from "@/lib/seo/site";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await personService.getCategoryBySlug(slug);
  if (!category) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  return pageMetadata(category.name, category.description, `/categories/${category.slug}`);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const copy = getMessages(defaultLocale);
  let category: Category | null = null;
  let people: Person[] = [];
  let professionalProfiles: PublicProfile[] = [];
  let unavailable = false;

  try {
    category = await personService.getCategoryBySlug(slug);
    if (category) {
      [people, professionalProfiles] = await Promise.all([
        personService.listPublishedPeopleByCategoryId(category.id),
        searchPublicProfiles("", category.id),
      ]);
    }
  } catch {
    unavailable = true;
  }

  if (!category && !unavailable) notFound();

  const displayPeople = category ? toDisplayPeople(people, [category]) : [];
  const hasPeople = displayPeople.length > 0 || professionalProfiles.length > 0;
  const publishedCount = displayPeople.length + professionalProfiles.length;

  return (
    <main className="a3lam-page">
      <div className="a3lam-shell">
        <SiteHeader copy={copy} active="categories" />
        <div className="route-page category-detail-page">
          <nav className="breadcrumb" aria-label={copy.navCategories}>
            <Link href="/">{copy.navHome}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/categories">{copy.navCategories}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{category?.name ?? copy.dataUnavailable}</span>
          </nav>

          <div className="route-heading category-detail-heading">
            <p className="eyebrow">{copy.categoriesEyebrow}</p>
            <h1>{category?.name ?? copy.dataUnavailable}</h1>
            <p className="route-description">{category?.description ?? copy.dataUnavailable}</p>
            {category ? <div className="category-stat-strip" aria-label="إحصاءات التصنيف"><strong>{publishedCount}</strong><span>ملفًا منشورًا</span><span className="category-stat-note">يظهر المحتوى المنشور والمتحقق فقط</span></div> : null}
          </div>

          <section className="category-people-section" aria-labelledby="category-people-title">
            <div className="section-header-row">
              <div>
                <p className="eyebrow">{copy.navPeople}</p>
                <h2 id="category-people-title">{copy.categoryPeopleTitle}</h2>
              </div>
              <Link className="text-link" href={`/search?category=${encodeURIComponent(category?.slug ?? "")}`}
>
                {copy.searchAction} <span aria-hidden="true">↗</span>
              </Link>
            </div>

            {unavailable ? (
              <div className="empty-state-block" role="alert">
                <p>{copy.dataUnavailable}</p>
                <Link className="button button-quiet" href="/categories">{copy.navCategories}</Link>
              </div>
            ) : hasPeople ? (
              <div className="people-grid">
                {professionalProfiles.length > 0 ? <div className="category-result-group-label">الملفات المهنية</div> : null}
                {professionalProfiles.map((profile) => (
                  <ProfessionalProfileCard key={`profile-${profile.id}`} profile={profile} />
                ))}
                {displayPeople.length > 0 ? <div className="category-result-group-label">الموسوعة التحريرية</div> : null}
                {displayPeople.map((person) => (
                  <PersonCard key={`legacy-${person.id}`} person={person} copy={copy} />
                ))}
              </div>
            ) : (
              <div className="empty-state-block" role="status">
                <p>{copy.categoryNoPeople}</p>
                <div className="state-actions">
                  <Link className="button button-primary" href="/search">{copy.searchAction}</Link>
                  <Link className="button button-quiet" href="/categories">{copy.navCategories}</Link>
                </div>
              </div>
            )}
          </section>
        </div>
        <SiteFooter copy={copy} />
      </div>
    </main>
  );
}
