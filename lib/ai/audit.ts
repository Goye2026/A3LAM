import type { AiAuditEvent } from "./types";

export type AiAuditLogInput = {
  id: string;
  actorType: AiAuditEvent["actorType"];
  actorId: string | null;
  entityType: AiAuditEvent["entityType"];
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  action: AiAuditEvent["action"];
  reason: string | null;
};

export function buildAiAuditLogInput(event: AiAuditEvent, id: string): AiAuditLogInput {
  return {
    id,
    actorType: event.actorType,
    actorId: event.actorId ?? null,
    entityType: event.entityType,
    entityId: event.entityId,
    field: event.field ?? "",
    oldValue: event.oldValue ?? null,
    newValue: event.newValue ?? null,
    action: event.action,
    reason: event.reason ?? null,
  };
}
