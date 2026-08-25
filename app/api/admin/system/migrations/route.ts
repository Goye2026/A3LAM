import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { getMigrationRegistryStatus } from "@/lib/admin/migrationRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "system.read");
  if (gate.response) return gate.response;

  try {
    const status = await getMigrationRegistryStatus();
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
