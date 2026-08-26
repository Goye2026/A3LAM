import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { personService } from "@/lib/services/personService";
import { getUnlistedOrPublishedProfileBySlug } from "@/lib/user/profileRepository";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function notFoundResponse() {
  return new NextResponse("المورد المطلوب غير موجود.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
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
    if (resource === "person") {
      const [hasPublishedPerson, publicProfile] = await Promise.all([
        personService.hasPublishedPersonSlug(slug),
        getUnlistedOrPublishedProfileBySlug(slug),
      ]);
      return hasPublishedPerson || Boolean(publicProfile) ? NextResponse.next() : notFoundResponse();
    }

    const exists = await personService.hasPublishedCategorySlug(slug);
    return exists ? NextResponse.next() : notFoundResponse();
  } catch {
    return notFoundResponse();
  }
}

export const config = {
  matcher: ["/person/:slug", "/categories/:slug", "/admin", "/admin/:path*", "/api/admin/:path*"],
};
