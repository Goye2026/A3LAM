import { NextResponse } from "next/server";
import { personService } from "@/lib/services/personService";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 120;

function bounded(value: string | null) {
  return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = bounded(url.searchParams.get("q"));
  const categoryId = bounded(url.searchParams.get("category"));
  const occupation = bounded(url.searchParams.get("occupation"));

  if (!query && !categoryId && !occupation) {
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    let resolvedCategoryId: string | undefined;
    if (categoryId) {
      const category = await personService.getCategoryBySlug(categoryId);
      if (!category) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
      resolvedCategoryId = category.id;
    }

    const people = await personService.searchPublishedPeople({
      query: query || undefined,
      categoryId: resolvedCategoryId,
      occupation: occupation || undefined,
    });
    return NextResponse.json(
      {
        items: people.map((person) => ({
          slug: person.slug,
          nameArabic: person.nameArabic,
          shortBio: person.shortBio,
          occupations: person.occupations,
          image: person.image,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "search_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
