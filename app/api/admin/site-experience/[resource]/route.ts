import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminAsync, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { isSiteExperienceResource } from "@/lib/site-experience/config";
import { siteExperienceAccess } from "@/lib/site-experience/access";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

type Context = { params: Promise<{ resource: string }> };

export const runtime = "nodejs";

async function getResource(context: Context) {
  const { resource } = await context.params;
  return isSiteExperienceResource(resource) ? resource : null;
}

export async function GET(request: Request, context: Context) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  const resource = await getResource(context);
  if (!resource) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
  const gate = await requirePermissionPrincipal(request, siteExperienceAccess[resource].read);
  if (gate.response) return gate.response;
  try {
    return NextResponse.json({ item: await siteExperienceRepository.getAdminResource(resource) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const authenticated = await requireAdminAsync(request);
  if (authenticated) return authenticated;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  const resource = await getResource(context);
  if (!resource) return NextResponse.json({ error: "NOT_FOUND", message: "The requested resource was not found." }, { status: 404 });
  const gate = await requirePermissionPrincipal(request, siteExperienceAccess[resource].update);
  if (gate.response) return gate.response;
  try {
    const body = await request.json() as unknown;
    if (typeof body !== "object" || body === null || Array.isArray(body) || !("config" in body)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
    const item = await siteExperienceRepository.saveDraft(resource, (body as { config: unknown }).config, gate.principal.id);
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
