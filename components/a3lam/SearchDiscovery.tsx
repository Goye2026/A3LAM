"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/domain/a3lam";
import type { PublicMessages } from "@/lib/i18n/messages";
import { Input } from "@/components/foundation/Primitives";
import { PersonCard } from "./PersonCard";

 type SearchDiscoveryProps = {
  copy: PublicMessages;
  categories: Category[];
  initialQuery?: string;
  initialCategorySlug?: string;
  initialCity?: string;
  initialCountry?: string;
};

type PublicSearchResult = {
  slug: string;
  nameArabic: string;
  name: string;
  shortBio: string;
  occupations: string[];
  image: string | null;
  city: string | null;
  country: string | null;
  skills: string[];
  categories: string[];
  source: "editorial" | "professional";
};

type SearchState = "idle" | "loading" | "success" | "error";
type SubmittedFilters = { query: string; categorySlug: string; city: string; country: string };

export function SearchDiscovery({ copy, categories, initialQuery = "", initialCategorySlug = "", initialCity = "", initialCountry = "" }: SearchDiscoveryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [submittedFilters, setSubmittedFilters] = useState<SubmittedFilters>({ query: initialQuery, categorySlug: initialCategorySlug, city: initialCity, country: initialCountry });
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");

  useEffect(() => {
    if (!submittedFilters.query.trim() && !submittedFilters.categorySlug && !submittedFilters.city.trim() && !submittedFilters.country.trim()) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (submittedFilters.query.trim()) params.set("q", submittedFilters.query.trim());
    if (submittedFilters.categorySlug) params.set("category", submittedFilters.categorySlug);
    if (submittedFilters.city.trim()) params.set("city", submittedFilters.city.trim());
    if (submittedFilters.country.trim()) params.set("country", submittedFilters.country.trim());
    void (async () => {
      try {
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("search request failed");
        const payload = (await response.json()) as { items?: PublicSearchResult[] };
        setResults(payload.items ?? []);
        setSearchState("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setSearchState("error");
      }
    })();
    return () => controller.abort();
  }, [submittedFilters]);

  function handleClear() {
    setQuery(""); setCategorySlug(""); setCity(""); setCountry("");
    setSubmittedFilters({ query: "", categorySlug: "", city: "", country: "" });
    setResults([]); setSearchState("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { query, categorySlug, city, country };
    const hasFilters = query.trim() || categorySlug || city.trim() || country.trim();
    if (!hasFilters) {
      setResults([]);
      setSearchState("idle");
      setSubmittedFilters(nextFilters);
      return;
    }
    setSearchState("loading");
    setSubmittedFilters(nextFilters);
  }

  return (
    <section className="discovery-panel" id="search" aria-labelledby="search-title">
      <div className="discovery-heading">
        <span className="eyebrow">{copy.searchLabel}</span>
        <h2 id="search-title">{copy.searchHint}</h2>
      </div>
      <form className="discovery-form discovery-form-advanced" onSubmit={handleSubmit} role="search">
        <label className="search-field search-field-wide">
          <span>{copy.searchLabel}</span>
          <Input id="a3lam-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} type="search" autoComplete="off" />
        </label>
        <label className="search-field">
          <span>{copy.searchFilterLabel}</span>
          <select id="a3lam-category" className="search-category" value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>
            <option value="">{copy.searchAllCategories}</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <label className="search-field">
          <span>{copy.searchCity}</span>
          <input id="a3lam-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder={copy.searchCityPlaceholder} />
        </label>
        <label className="search-field">
          <span>{copy.searchCountry}</span>
          <input id="a3lam-country" value={country} onChange={(event) => setCountry(event.target.value)} placeholder={copy.searchCountryPlaceholder} />
        </label>
        <button className="search-submit" type="submit"><span aria-hidden="true">⌕</span>{copy.searchAction}</button>
      </form>
      <div className="search-result-region" aria-live="polite" aria-atomic="true">
        {searchState === "loading" ? <p className="search-empty" role="status">{copy.searchLoading}</p> : null}
        {searchState === "error" ? <p className="search-empty" role="alert">{copy.searchError}</p> : null}
        {searchState === "success" ? results.length > 0 ? (
          <div className="search-results">
            <div className="search-results-header"><p className="search-results-label">{copy.searchResults} · {results.length}</p><button className="search-reset" type="button" onClick={handleClear}>{copy.clearSearch}</button></div>
            <div className="search-result-list">
              {results.map((result) => result.source === "professional" ? <ProfessionalSearchResult key={result.slug} result={result} copy={copy} /> : <PersonCard key={result.slug} person={{ id: result.slug, slug: result.slug, name: result.nameArabic, role: result.occupations[0] ?? "", meta: result.shortBio, initials: result.nameArabic.slice(0, 2), image: result.image, tone: "teal", tags: [], status: "published" }} copy={copy} />)}
            </div>
          </div>
        ) : (
          <div className="search-empty-block"><p className="search-empty">{copy.searchEmpty}</p><p className="search-empty-hint">{copy.searchNoResultsHint}</p><button className="search-reset" type="button" onClick={handleClear}>{copy.clearSearch}</button></div>
        ) : null}
      </div>
    </section>
  );
}

function ProfessionalSearchResult({ result, copy }: { result: PublicSearchResult; copy: PublicMessages }) {
  const location = [result.city, result.country].filter(Boolean).join("، ");
  return <article className="search-profile-result"><div className="search-profile-result-heading"><span className="status-badge status-published">{copy.searchProfessional}</span><a className="search-profile-result-name" href={`/person/${result.slug}`}>{result.nameArabic}</a>{result.name !== result.nameArabic ? <span className="profile-latin-name">{result.name}</span> : null}</div><p className="person-card-role">{result.occupations[0] || "شخصية مهنية"}</p>{location ? <p className="person-card-meta">{copy.searchLocationLabel}: {location}</p> : null}<p>{result.shortBio}</p>{result.skills.length > 0 ? <div className="card-skill-list" aria-label={copy.searchSkillsLabel}>{result.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}</article>;
}
