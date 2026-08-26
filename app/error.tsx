"use client";

import Link from "next/link";
import { useEffect } from "react";
import { defaultLocale } from "@/lib/i18n/config";
import { getPublicErrorMessages } from "@/lib/i18n/public-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = getPublicErrorMessages(defaultLocale);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="a3lam-page" role="alert">
      <div className="a3lam-shell">
        <div className="state-page error-state">
          <p className="eyebrow">500 / {copy.siteName}</p>
          <h1>{copy.dataUnavailable}</h1>
          <p className="hero-lede">{copy.searchError}</p>
          <div className="state-actions">
            <button className="button button-primary" type="button" onClick={() => reset()}>
              {copy.retryAction}
            </button>
            <Link className="button button-quiet" href="/">
              {copy.notFoundAction}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
