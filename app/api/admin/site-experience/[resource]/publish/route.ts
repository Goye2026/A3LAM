import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { isSiteExperienceResource } from "@/lib/site-experience/config";
import { siteExperienceAccess } from "@/lib/site-experience/access";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

type Context = { params: Promise<{ resource: string }> };

export const runtime = "nodejs";

export async function POST(request: Request, context: Context) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  const { resource: rawResource } = await context.params;
  if (!isSiteExperienceResource(rawResource)) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
  const gate = await requirePermissionPrincipal(request, siteExperienceAccess[rawResource].publish);
  if (gate.response) return gate.response;
  try {
    const item = await siteExperienceRepository.publish(rawResource, gate.principal.id);
    if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
