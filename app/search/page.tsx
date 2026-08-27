import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/a3lam/SiteFrame";
import { SearchDiscovery } from "@/components/a3lam/SearchDiscovery";
import type { Category } from "@/lib/domain/a3lam";
import { defaultLocale } from "@/lib/i18n/config";
import { getPublicMessages } from "@/lib/i18n/messages";
import { personService } from "@/lib/services/personService";
import { pageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const copy = getPublicMessages(defaultLocale);
  return {
    ...pageMetadata(copy.searchPageTitle, copy.searchPageDescription, "/search"),
    robots: { index: false, follow: true },
  };
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const copy = getPublicMessages(defaultLocale);
  const publicCopy = getPublicMessages(defaultLocale);
  const params = await searchParams;
  let categories: Category[] = [];
  let unavailable = false;

  try {
    categories = await personService.listCategories();
  } catch {
    unavailable = true;
  }

  return (
    <SiteFrame copy={publicCopy} active="search" template="search">
      <main className="a3lam-page">
        <div className="a3lam-shell">
          <div className="route-page route-page-search">
          <div className="route-heading">
            <Link className="back-link" href="/">
              <span aria-hidden="true">↙</span>
              {copy.searchPageBack}
            </Link>
            <p className="eyebrow">{copy.searchLabel}</p>
            <h1>{copy.searchPageTitle}</h1>
            <p className="route-description">{copy.searchPageDescription}</p>
          </div>
          {unavailable ? <p className="empty-state" role="alert">{copy.dataUnavailable}</p> : null}
          <SearchDiscovery
            copy={publicCopy}
            categories={categories}
            initialQuery={firstParam(params.q)}
            initialCategorySlug={firstParam(params.category)}
            initialCity={firstParam(params.city)}
            initialCountry={firstParam(params.country)}
          />
          </div>
        </div>
      </main>
    </SiteFrame>
  );
}
