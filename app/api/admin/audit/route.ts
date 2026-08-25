import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { adminRepository } from "@/lib/data/adminRepository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "audit.read");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    return NextResponse.json({ items: await adminRepository.listAuditLogs({ actor: url.searchParams.get("actor") ?? undefined, action: url.searchParams.get("action") ?? undefined, entityType: url.searchParams.get("entityType") ?? undefined, entityId: url.searchParams.get("entityId") ?? undefined, from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined }) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
