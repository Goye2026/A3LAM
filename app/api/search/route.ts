import { NextResponse } from "next/server";
import { personService } from "@/lib/services/personService";
import { searchPublicProfiles } from "@/lib/user/profileRepository";

export const runtime = "nodejs";
const MAX_QUERY_LENGTH = 120;

function bounded(value: string | null) { return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH); }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = bounded(url.searchParams.get("q"));
  const categoryId = bounded(url.searchParams.get("category"));
  const occupation = bounded(url.searchParams.get("occupation"));
  const city = bounded(url.searchParams.get("city"));
  const country = bounded(url.searchParams.get("country"));
  if (!query && !categoryId && !occupation && !city && !country) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    let resolvedCategoryId: string | undefined;
    if (categoryId) {
      const category = await personService.getCategoryBySlug(categoryId);
      if (!category) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
      resolvedCategoryId = category.id;
    }
    const [people, profiles] = await Promise.all([
      personService.searchPublishedPeople({ query: query || undefined, categoryId: resolvedCategoryId, occupation: occupation || undefined }),
      searchPublicProfiles(query, resolvedCategoryId, { city: city || undefined, country: country || undefined }),
    ]);
    const legacyItems = people.map((person) => ({ slug: person.slug, nameArabic: person.nameArabic, name: person.name, shortBio: person.shortBio, occupations: person.occupations, image: person.image, city: person.birthPlace ?? null, country: null, skills: [], categories: person.categoryIds, source: "editorial" as const }));
    const profileItems = profiles.filter((profile) => !occupation || profile.professionalTitle.toLocaleLowerCase().includes(occupation.toLocaleLowerCase())).map((profile) => ({ slug: profile.slug, nameArabic: profile.nameArabic, name: profile.name, shortBio: profile.professionalSummary || profile.biography.slice(0, 240), occupations: profile.professionalTitle ? [profile.professionalTitle] : profile.categories.map((category) => category.name), image: profile.imageUrl, city: profile.city, country: profile.country, skills: profile.skills.slice(0, 6), categories: profile.categories.map((category) => category.name), source: "professional" as const }));
    const seen = new Set<string>();
    const items = [...legacyItems, ...profileItems].filter((item) => { if (seen.has(item.slug)) return false; seen.add(item.slug); return true; });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "search_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
