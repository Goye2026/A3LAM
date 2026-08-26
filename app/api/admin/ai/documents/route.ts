import { NextResponse } from "next/server";
import { AI_PRODUCTION_ENABLED } from "@/lib/ai/activation";
import { getAiQueueProviderState } from "@/lib/ai/queue";
import { listAdminAiDocuments } from "@/lib/ai/persistence";
import { submitAiDocument } from "@/lib/ai/pipeline";
import { getDocumentStorageState } from "@/lib/ai/storage";
import { validateAiDocument } from "@/lib/ai/validation";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "ai.documents.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    return NextResponse.json({ ok: true, ...(await listAdminAiDocuments({ page, pageSize })) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const gate = await requirePermissionPrincipal(request, "ai.documents.create");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  if (!AI_PRODUCTION_ENABLED) return NextResponse.json({ error: "AI_PROCESSING_DISABLED", message: "AI Production Processing غير مفعّل." }, { status: 503 });
  if (getDocumentStorageState() !== "AVAILABLE" || getAiQueueProviderState() !== "AVAILABLE") return NextResponse.json({ error: "DEPENDENCY_UNAVAILABLE", message: "Private document storage and processing queue require configuration." }, { status: 503 });

  try {
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) return NextResponse.json({ error: "INVALID_INPUT", message: "A document file is required." }, { status: 400 });
    if (!gate.principal.id) return NextResponse.json({ error: "FORBIDDEN", message: "An identified administrator is required." }, { status: 403 });
    const validated = await validateAiDocument(value);
    const result = await submitAiDocument(validated, { ownerType: "ADMIN_IDENTITY", ownerId: gate.principal.id }, gate.principal.id);
    return NextResponse.json({ ok: true, ...result }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
