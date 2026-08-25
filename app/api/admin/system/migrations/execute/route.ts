import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { recordMigrationAudit, recordMigrationAuditInTransaction } from "@/lib/admin/migrationAudit";
import { isMigrationExecutionConfirmation } from "@/lib/admin/migrationExecution";
import { getMigrationPreflight } from "@/lib/admin/migrationRegistry";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getSqlClient } from "@/lib/db/client";
import { runNextMigration, type MigrationTransaction } from "@/lib/db/migrations/runner.mjs";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeExecutionResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const gate = await requirePermissionPrincipal(request, "system.migrations.execute");
  if (gate.response) return gate.response;

  if (!(await hasEffectiveAdminPermission(gate.principal, "system.read"))) return NextResponse.json({ error: "FORBIDDEN", message: "You do not have permission to perform this action." }, { status: 403 });
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });

  let body: unknown = null;
  try { body = await request.json(); } catch { body = null; }
  if (!isMigrationExecutionConfirmation(body)) return NextResponse.json({ error: "INVALID_INPUT", message: "The submitted value is invalid." }, { status: 400 });

  let targetVersion: string | null = null;
  try {
    const preflight = await getMigrationPreflight();
    targetVersion = preflight.nextMigration;
    if (preflight.execution !== "eligible" || !targetVersion) {
      await recordMigrationAudit(gate.principal.id, targetVersion ?? "migration-control", "migration.execution.blocked", preflight.reason);
      return safeExecutionResponse({ execution: "BLOCKED", reason: preflight.reason, preflight }, 409);
    }

    await recordMigrationAudit(gate.principal.id, targetVersion, "migration.execution.started", null);
    const result = await runNextMigration(getSqlClient() as unknown as MigrationTransaction, {
      expectedVersion: targetVersion,
      afterMigration: async (transaction, version) => recordMigrationAuditInTransaction(transaction, gate.principal.id, version, "migration.execution.succeeded", null),
    });
    const postflight = await getMigrationPreflight();
    const applied = postflight.registrySnapshot.items.some((item) => item.version === targetVersion && item.state === "APPLIED");
    if (result.status !== "applied" || result.version !== targetVersion || !applied) return safeExecutionResponse({ execution: "VERIFICATION_UNAVAILABLE", reason: "POST_EXECUTION_VERIFICATION_FAILED", preflight: postflight }, 503);
    return safeExecutionResponse({ execution: "APPLIED", migration: targetVersion, preflight: postflight });
  } catch (error) {
    try { await recordMigrationAudit(gate.principal.id, targetVersion ?? "migration-control", "migration.execution.failed", error instanceof Error ? error.name : "MIGRATION_EXECUTION_FAILED"); } catch { /* Preserve the original safe response if audit storage is unavailable. */ }
    return adminErrorResponse(error);
  }
}
