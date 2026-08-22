import { NextResponse } from "next/server";
import { personService } from "@/lib/services/personService";

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
    const people = await personService.searchPublishedPeople({
      query: query || undefined,
      categoryId: categoryId || undefined,
      occupation: occupation || undefined,
    });
    return NextResponse.json(
      {
        items: people.map((person) => ({
          id: person.id,
          slug: person.slug,
          name: person.name,
          nameArabic: person.nameArabic,
          shortBio: person.shortBio,
          categoryIds: person.categoryIds,
          occupations: person.occupations,
          image: person.image,
          status: person.status,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "search_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
