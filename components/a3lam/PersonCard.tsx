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
          <span className="sample-pill">{copy.demoLabel}</span>
          <span className="person-id">{person.id.replace("sample-profile-", "#")}</span>
        </div>
        <h3>{person.name}</h3>
        <p className="person-role">{person.role}</p>
        <p className="person-meta">{person.meta}</p>
        <div className="person-tags" aria-label={copy.featuredTitle}>
          {person.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <Link className="person-card-link" href={`/person/${person.id}`} aria-label={`${copy.profileView}: ${person.name}`}>
        <span aria-hidden="true">↗</span>
        {copy.profileView}
      </Link>
    </article>
  );
}
