import type { ProfileRecord } from "@/lib/user/profileRepository";

const COMPLETION_ITEMS = [
  { label: "المعلومات الأساسية", complete: (record: ProfileRecord) => Boolean(record.profile.name.trim() && record.profile.nameArabic.trim() && record.profile.slug) },
  { label: "النبذة المهنية", complete: (record: ProfileRecord) => Boolean(record.profile.professionalTitle.trim() && (record.profile.professionalSummary.trim() || record.profile.biography.trim())) },
  { label: "الخبرات", complete: (record: ProfileRecord) => record.experiences.length > 0 },
  { label: "التعليم", complete: (record: ProfileRecord) => record.educations.length > 0 },
  { label: "المهارات", complete: (record: ProfileRecord) => record.skills.length > 0 },
  { label: "الأعمال", complete: (record: ProfileRecord) => record.portfolio.length > 0 },
  { label: "الروابط المهنية", complete: (record: ProfileRecord) => record.socialLinks.length > 0 },
  { label: "المصدر", complete: (record: ProfileRecord) => Boolean(record.source?.title && record.source.url) },
] as const;

export type ProfileCompletion = { percent: number; completed: string[]; remaining: string[] };

export function calculateProfileCompletion(record: ProfileRecord | null): ProfileCompletion {
  if (!record) return { percent: 0, completed: [], remaining: COMPLETION_ITEMS.map((item) => item.label) };
  const completed = COMPLETION_ITEMS.filter((item) => item.complete(record)).map((item) => item.label);
  const remaining = COMPLETION_ITEMS.filter((item) => !item.complete(record)).map((item) => item.label);
  return { percent: Math.round((completed.length / COMPLETION_ITEMS.length) * 100), completed, remaining };
}
