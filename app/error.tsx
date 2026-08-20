"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="shell state-page" role="alert">
      <p className="eyebrow">500 / FOUNDATION</p>
      <h1>Something went wrong</h1>
      <p className="hero-lede">The error was recorded without exposing internal details.</p>
      <button className="button button-primary" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
