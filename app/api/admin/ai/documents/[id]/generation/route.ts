import { NextResponse } from "next/server";
import { AI_PRODUCTION_ENABLED } from "@/lib/ai/activation";
import { getAiGenerationProviderStatus } from "@/lib/ai/provider";
import { createAiGenerationJob } from "@/lib/ai/generation/persistence";
import { getAiPersistenceState } from "@/lib/ai/workspace";
import { AI_GENERATION_LANGUAGES, AI_GENERATION_MODES } from "@/lib/ai/types";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionPrincipal(request, "ai.generation.create");
  if (gate.response) return gate.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
  if (!AI_PRODUCTION_ENABLED) return NextResponse.json({ error: "AI_PROCESSING_DISABLED", message: "AI Production Processing غير مفعّل." }, { status: 503 });
  if (getAiGenerationProviderStatus() !== "READY" || await getAiPersistenceState() !== "AVAILABLE") return NextResponse.json({ error: "DEPENDENCY_UNAVAILABLE", message: "AI generation requires an approved provider and initialized private persistence." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 32_768) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE", message: "The submitted value is too large." }, { status: 413 });

  try {
    const { id } = await context.params;
    if (!gate.principal.id) return NextResponse.json({ error: "FORBIDDEN", message: "An identified administrator is required." }, { status: 403 });
    const body = await request.json() as { mode?: unknown; outputLanguage?: unknown };
    if (!AI_GENERATION_MODES.includes(body.mode as (typeof AI_GENERATION_MODES)[number]) || !AI_GENERATION_LANGUAGES.includes(body.outputLanguage as (typeof AI_GENERATION_LANGUAGES)[number])) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });
    const mode = body.mode as (typeof AI_GENERATION_MODES)[number];
    const outputLanguage = body.outputLanguage as (typeof AI_GENERATION_LANGUAGES)[number];
    const result = await createAiGenerationJob({ documentId: id, owner: { ownerType: "ADMIN_IDENTITY", ownerId: gate.principal.id }, mode, outputLanguage, actorId: gate.principal.id });
    if (!result) return NextResponse.json({ error: "NOT_FOUND", message: "The document was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...result }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
