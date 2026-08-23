import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { personService } from "@/lib/services/personService";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function notFoundResponse(request: NextRequest) {
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

function adminUnauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "This action is not available." }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") return NextResponse.next();
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    return isAdminRequest(request) ? NextResponse.next() : adminUnauthorizedResponse(request);
  }

  const segments = pathname.split("/").filter(Boolean);
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
  matcher: ["/person/:slug", "/categories/:slug", "/admin", "/admin/:path*", "/api/admin/:path*"],
};
