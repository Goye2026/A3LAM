import Link from "next/link";
import { PersonPortrait } from "@/components/a3lam/PersonPortrait";
import type { PublicProfile } from "@/lib/user/profileRepository";

export function ProfessionalProfileCard({ profile }: { profile: PublicProfile }) {
  return <article className="person-card professional-profile-card"><Link href={`/person/${profile.slug}`} className="person-card-link"><PersonPortrait className="person-card-avatar" src={profile.imageUrl} alt={profile.nameArabic} initials={profile.nameArabic.slice(0, 2)} tone="teal" /><div className="person-card-content"><span className="status-badge status-published">ملف مهني</span><h3>{profile.nameArabic}</h3><p className="person-card-role">{profile.professionalTitle || "شخصية مهنية"}</p><p>{profile.professionalSummary || profile.biography.slice(0, 140)}</p></div></Link></article>;
}
