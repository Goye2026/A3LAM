"use client";

import { FormEvent, useMemo, useState } from "react";
import { displayPeople } from "@/lib/a3lam/catalog";
import type { FoundationMessages } from "@/lib/i18n/messages";
import { Input } from "@/components/foundation/Primitives";
import { PersonCard } from "./PersonCard";

type SearchDiscoveryProps = {
  copy: FoundationMessages;
};

export function SearchDiscovery({ copy }: SearchDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const results = useMemo(() => {
    const normalized = submittedQuery.trim().toLocaleLowerCase("ar");
    if (!normalized) return [];

    return displayPeople.filter((person) =>
      [person.name, person.role, person.meta, ...person.tags]
        .join(" ")
        .toLocaleLowerCase("ar")
        .includes(normalized),
    );
  }, [submittedQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
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
        <button className="search-submit" type="submit">
          <span aria-hidden="true">⌕</span>
          {copy.searchAction}
        </button>
      </form>
      <div className="search-result-region" aria-live="polite" aria-atomic="true">
        {submittedQuery ? (
          results.length > 0 ? (
            <div className="search-results">
              <p className="search-results-label">
                {copy.searchResults} · {results.length}
              </p>
              {results.map((person) => (
                <PersonCard key={person.id} person={person} copy={copy} />
              ))}
            </div>
          ) : (
            <p className="search-empty">{copy.searchEmpty}</p>
          )
        ) : null}
      </div>
    </section>
  );
}
