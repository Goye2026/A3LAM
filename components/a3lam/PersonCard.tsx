import Link from "next/link";
import type { DisplayPerson } from "@/lib/a3lam/catalog";
import type { PublicMessages } from "@/lib/i18n/messages";
import { PersonPortrait } from "./PersonPortrait";

type PersonCardProps = {
  person: DisplayPerson;
  copy: PublicMessages;
};

export function PersonCard({ person, copy }: PersonCardProps) {
  return (
    <article className="person-card">
      <PersonPortrait
        className="person-card-avatar"
        src={person.image}
        alt={person.name}
        initials={person.initials}
        tone={person.tone}
      />
      <div className="person-card-body">
        <div className="person-card-topline">
          <span className="sample-pill">{person.status === "published" ? copy.publishedProfileStatus : copy.demoLabel}</span>
        </div>
        <h3>{person.name}</h3>
        <p className="person-role">{person.role}</p>
        <p className="person-meta">{person.meta}</p>
        {person.tags.length > 0 ? (
          <div className="person-tags" aria-label={copy.profileCategories}>
            {person.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
      {person.status === "published" ? (
        <Link className="person-card-link" href={`/person/${person.slug}`} aria-label={`${copy.profileView}: ${person.name}`}>
          <span aria-hidden="true">↗</span>
          {copy.profileView}
        </Link>
      ) : (
        <span className="person-card-link person-card-link-disabled" aria-label={`${copy.notPublished}: ${person.name}`}>
          <span aria-hidden="true">—</span>
          {copy.notPublished}
        </span>
      )}
    </article>
  );
}
