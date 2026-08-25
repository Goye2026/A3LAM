import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { MigrationTransaction } from "@/lib/db/migrations/runner.mjs";

export type MigrationAuditAction = "migration.execution.started" | "migration.execution.succeeded" | "migration.execution.failed" | "migration.execution.blocked";

export async function recordMigrationAudit(actorId: string | null, migrationVersion: string, action: MigrationAuditAction, reason: string | null) {
  await getDb().insert(schema.auditLogs).values({
    id: randomUUID(),
    actorType: "admin_identity",
    actorId,
    entityType: "migration",
    entityId: migrationVersion,
    field: "execution",
    oldValue: null,
    newValue: action,
    action,
    reason,
  });
}

export async function recordMigrationAuditInTransaction(transaction: MigrationTransaction, actorId: string | null, migrationVersion: string, action: MigrationAuditAction, reason: string | null) {
  await transaction`
    INSERT INTO audit_logs (id, actor_type, actor_id, entity_type, entity_id, field, old_value, new_value, action, reason)
    VALUES (${randomUUID()}, ${"admin_identity"}, ${actorId}, ${"migration"}, ${migrationVersion}, ${"execution"}, ${null}, ${action}, ${action}, ${reason})
  `;
}
