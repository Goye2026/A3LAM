import { NextResponse } from "next/server";
import { getAiProductionReadinessReport } from "@/lib/ai/readiness";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "ai.documents.read");
  if (gate.response) return gate.response;
  try {
    const report = await getAiProductionReadinessReport();
    return NextResponse.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
