import { NextResponse, type NextRequest } from "next/server";
import { personService } from "@/lib/services/personService";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function notFoundResponse(request: NextRequest) {
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

export async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const [resource, slug] = segments;
  if (!slug || segments.length !== 2 || !SLUG_PATTERN.test(slug)) return NextResponse.next();

  try {
    const exists = resource === "person"
      ? await personService.hasPublishedPersonSlug(slug)
      : await personService.hasPublishedCategorySlug(slug);
    return exists ? NextResponse.next() : notFoundResponse(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/person/:slug", "/categories/:slug"],
};
