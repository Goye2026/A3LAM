import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { CmsInputError, parseCmsTagInput } from "@/lib/cms/editorialValidation";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";
import { readBoundedJson } from "@/lib/admin/requestBody";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requirePermissionPrincipal(request, "taxonomy.update");
  if (access.response) return access.response;
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "FORBIDDEN", message: "Request origin is not allowed" }, { status: 403 });
  try {
    const { id } = await context.params;
    const input = parseCmsTagInput(await readBoundedJson(request));
    const db = getDb();
    const rows = await db.select().from(schema.cmsTags).where(eq(schema.cmsTags.id, id)).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "NOT_FOUND", message: "Tag not found" }, { status: 404 });
    const updated = await db.update(schema.cmsTags).set({ name: input.name, slug: input.slug, updatedAt: new Date() }).where(and(eq(schema.cmsTags.id, id))).returning();
    if (!updated[0]) throw new CmsInputError("Tag could not be updated");
    await db.insert(schema.auditLogs).values({ id: randomUUID(), actorType: "admin_identity", actorId: access.principal?.id ?? null, entityType: "cms_tag", entityId: id, field: "record", oldValue: rows[0].slug, newValue: input.slug, action: "update", reason: null });
    return NextResponse.json({ ok: true, tag: { ...updated[0], createdAt: updated[0].createdAt.toISOString(), updatedAt: updated[0].updatedAt.toISOString() } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
