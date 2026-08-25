import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getMigrationPreflight } from "@/lib/admin/migrationRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "system.read");
  if (gate.response) return gate.response;

  try {
    const [preflight, canExecute] = await Promise.all([
      getMigrationPreflight(),
      hasEffectiveAdminPermission(gate.principal, "system.migrations.execute"),
    ]);
    return NextResponse.json({ ...preflight, authorization: canExecute ? "AUTHORIZED" : "NOT_AUTHORIZED" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
