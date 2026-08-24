import Link from "next/link";
import { PersonPortrait } from "@/components/a3lam/PersonPortrait";
import type { PublicProfile } from "@/lib/user/profileRepository";

export function ProfessionalProfileCard({ profile }: { profile: PublicProfile }) {
  const location = [profile.city, profile.country].filter(Boolean).join("، ");
  return (
    <article className="person-card professional-profile-card">
      <Link href={`/person/${profile.slug}`} className="person-card-link">
        <PersonPortrait className="person-card-avatar" src={profile.imageUrl} alt={profile.nameArabic} initials={profile.nameArabic.slice(0, 2)} tone="teal" />
        <div className="person-card-content">
          <span className="status-badge status-published">ملف مهني</span>
          <h3>{profile.nameArabic}</h3>
          {profile.name !== profile.nameArabic ? <p className="profile-latin-name">{profile.name}</p> : null}
          <p className="person-card-role">{profile.professionalTitle || "شخصية مهنية"}</p>
          {location ? <p className="person-card-meta">{location}</p> : null}
          <p>{profile.professionalSummary || profile.biography.slice(0, 140)}</p>
          {profile.skills.length > 0 ? <div className="card-skill-list" aria-label="المهارات">{profile.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div> : null}
        </div>
      </Link>
    </article>
  );
}
