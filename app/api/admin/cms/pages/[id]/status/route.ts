import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { CmsInputError } from "@/lib/cms/editorialValidation";
import { isCmsEditorialStatus, type CmsEditorialStatus } from "@/lib/cms/editorialStatus";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { readBoundedJson } from "@/lib/admin/requestBody";

function permissionForStatus(status: CmsEditorialStatus) {
  if (status === "published") return "content.publish" as const;
  if (status === "scheduled") return "content.schedule" as const;
  if (status === "review") return "content.review" as const;
  if (status === "trashed") return "content.trash" as const;
  return "content.update" as const;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const body = await readBoundedJson(request);
    if (!body || typeof body !== "object") throw new CmsInputError("The status payload is invalid");
    const next = (body as { status?: unknown }).status;
    const expectedVersion = Number((body as { expectedVersion?: unknown }).expectedVersion);
    if (!isCmsEditorialStatus(next)) throw new CmsInputError("status is invalid");
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new CmsInputError("expectedVersion is invalid");
    const access = await requirePermissionPrincipal(request, permissionForStatus(next));
    if (access.response) return access.response;
    const { id } = await context.params;
    const record = await editorialRepository.transition("page", id, next, expectedVersion, access.principal?.id ?? null);
    if (!record) return NextResponse.json({ error: "NOT_FOUND", message: "Content not found" }, { status: 404 });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
