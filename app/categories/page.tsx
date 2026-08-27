import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCard } from "@/components/a3lam/CategoryCard";
import { SiteFrame } from "@/components/a3lam/SiteFrame";
import { toDisplayCategories } from "@/lib/a3lam/catalog";
import type { Category } from "@/lib/domain/a3lam";
import { defaultLocale } from "@/lib/i18n/config";
import { getPublicMessages } from "@/lib/i18n/messages";
import { personService } from "@/lib/services/personService";
import { pageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const copy = getPublicMessages(defaultLocale);
  return pageMetadata(copy.categoriesPageTitle, copy.categoriesPageDescription, "/categories");
}

export default async function CategoriesPage() {
  const copy = getPublicMessages(defaultLocale);
  let categories: Category[] = [];
  let unavailable = false;

  try {
    categories = await personService.listCategories();
  } catch {
    unavailable = true;
  }

  const displayCategories = toDisplayCategories(categories);

  return (
    <SiteFrame copy={copy} active="categories" template="category">
      <main className="a3lam-page">
        <div className="a3lam-shell">
          <div className="route-page route-page-categories">
          <div className="route-heading">
            <Link className="back-link" href="/">
              <span aria-hidden="true">↙</span>
              {copy.backToDirectory}
            </Link>
            <p className="eyebrow">{copy.categoriesEyebrow}</p>
            <h1>{copy.categoriesPageTitle}</h1>
            <p className="route-description">{copy.categoriesPageDescription}</p>
          </div>
          {unavailable || displayCategories.length === 0 ? (
            <p className="empty-state" role={unavailable ? "alert" : "status"}>
              {unavailable ? copy.dataUnavailable : copy.categoryNoPeople}
            </p>
          ) : (
            <div className="category-grid category-grid-route">
              {displayCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
          </div>
        </div>
      </main>
    </SiteFrame>
  );
}
