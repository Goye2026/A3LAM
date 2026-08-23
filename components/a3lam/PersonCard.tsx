import Link from "next/link";
import type { DisplayPerson } from "@/lib/a3lam/catalog";
import type { FoundationMessages } from "@/lib/i18n/messages";

type PersonCardProps = {
  person: DisplayPerson;
  copy: FoundationMessages;
};

export function PersonCard({ person, copy }: PersonCardProps) {
  return (
    <article className="person-card">
      <div className={`person-avatar avatar-${person.tone}`} aria-hidden="true">
        {person.initials}
      </div>
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
