import { FoundationLink } from "@/components/foundation/Primitives";

export default function NotFound() {
  return (
    <main className="shell state-page">
      <p className="eyebrow">404 / FOUNDATION</p>
      <h1>Page not found</h1>
      <p className="hero-lede">The requested foundation route does not exist.</p>
      <FoundationLink className="button button-secondary" href="/">
        Return to foundation
      </FoundationLink>
    </main>
  );
}
