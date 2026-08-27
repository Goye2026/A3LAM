import { NextResponse } from "next/server";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { parseCmsBulkStatusInput } from "@/lib/cms/editorialValidation";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { readBoundedJson } from "@/lib/admin/requestBody";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

function permissionForBulkStatus(status: "draft" | "review" | "scheduled" | "published" | "trashed") {
  if (status === "review") return "content.review" as const;
  if (status === "trashed") return "content.trash" as const;
  if (status === "published") return "content.publish" as const;
  if (status === "scheduled") return "content.schedule" as const;
  return "content.update" as const;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const input = parseCmsBulkStatusInput(await readBoundedJson(request));
    const gate = await requirePermissionPrincipal(request, permissionForBulkStatus(input.status));
    if (gate.response) return gate.response;
    const result = await editorialRepository.bulkTransition("page", input, gate.principal.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return adminErrorResponse(error); }
}
