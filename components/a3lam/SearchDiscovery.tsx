"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/domain/a3lam";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { Input } from "@/components/foundation/Primitives";
import { PersonCard } from "./PersonCard";

type SearchDiscoveryProps = {
  copy: FoundationMessages;
  categories: Category[];
  initialQuery?: string;
  initialCategoryId?: string;
};

type PublicSearchResult = {
  id: string;
  slug: string;
  name: string;
  nameArabic: string;
  shortBio: string;
  categoryIds: string[];
  occupations: string[];
  image: string | null;
  status: "published";
};

type SearchState = "idle" | "loading" | "success" | "error";

type SubmittedFilters = {
  query: string;
  categoryId: string;
};

export function SearchDiscovery({ copy, categories, initialQuery = "", initialCategoryId = "" }: SearchDiscoveryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [submittedFilters, setSubmittedFilters] = useState<SubmittedFilters>({ query: initialQuery, categoryId: initialCategoryId });
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!submittedFilters.query.trim() && !submittedFilters.categoryId) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (submittedFilters.query.trim()) params.set("q", submittedFilters.query.trim());
    if (submittedFilters.categoryId) params.set("category", submittedFilters.categoryId);

    void (async () => {
      try {
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
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
  }, [submittedFilters, requestId]);

  function handleClear() {
    setQuery("");
    setCategoryId("");
    setSubmittedFilters({ query: "", categoryId: "" });
    setResults([]);
    setSearchState("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() && !categoryId) {
      setSubmittedFilters({ query: "", categoryId: "" });
      setResults([]);
      setSearchState("idle");
      return;
    }
    setSearchState("loading");
    setSubmittedFilters({ query, categoryId });
    setRequestId((current) => current + 1);
  }

  return (
    <section className="discovery-panel" id="search" aria-labelledby="search-title">
      <div className="discovery-heading">
        <span className="eyebrow">{copy.searchLabel}</span>
        <h2 id="search-title">{copy.searchHint}</h2>
      </div>
      <form className="discovery-form" onSubmit={handleSubmit} role="search">
        <label className="sr-only" htmlFor="a3lam-search">
          {copy.searchLabel}
        </label>
        <Input
          id="a3lam-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          type="search"
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="a3lam-category">
          {copy.searchFilterLabel}
        </label>
        <select
          id="a3lam-category"
          className="search-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{copy.searchAllCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button className="search-submit" type="submit">
          <span aria-hidden="true">⌕</span>
          {copy.searchAction}
        </button>
      </form>
      <div className="search-result-region" aria-live="polite" aria-atomic="true">
        {searchState === "loading" ? <p className="search-empty" role="status">{copy.searchLoading}</p> : null}
        {searchState === "error" ? <p className="search-empty" role="alert">{copy.searchError}</p> : null}
        {searchState === "success" ? (
          results.length > 0 ? (
            <div className="search-results">
              <p className="search-results-label">
                {copy.searchResults} · {results.length}
              </p>
              {results.map((person) => (
                <PersonCard
                  key={person.id}
                  person={{
                    id: person.id,
                    slug: person.slug,
                    name: person.nameArabic,
                    role: person.occupations[0] ?? "",
                    meta: person.shortBio,
                    initials: person.nameArabic.slice(0, 2),
                    tone: "teal",
                    tags: [],
                    status: person.status,
                  }}
                  copy={copy}
                />
              ))}
            </div>
          ) : (
            <div className="search-empty-block">
              <p className="search-empty">{copy.searchEmpty}</p>
              <p className="search-empty-hint">{copy.searchNoResultsHint}</p>
              <button className="search-reset" type="button" onClick={handleClear}>
                {copy.clearSearch}
              </button>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
