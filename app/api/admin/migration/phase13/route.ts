import postgres from "postgres";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/user/requestSecurity";

export const runtime = "nodejs";

const MIGRATION = "0003_phase13_profiles.sql";
const REQUIRED_TABLES = ["user_accounts", "user_sessions", "profiles", "profile_categories", "profile_source_records", "profile_experiences", "profile_educations", "profile_skills", "profile_certifications", "profile_languages", "profile_portfolio_items", "profile_social_links", "profile_files", "audit_logs"];

export async function POST(request: Request) {
  if (!isSameOriginMutation(request) || !isAdminRequest(request)) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  let body: { migration?: unknown; confirm?: unknown };
  try { body = await request.json() as { migration?: unknown; confirm?: unknown }; } catch { return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 }); }
  if (body.migration !== MIGRATION || body.confirm !== "phase13-once") return NextResponse.json({ message: "تأكيد migration غير صالح" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return NextResponse.json({ message: "قاعدة البيانات غير مهيأة" }, { status: 503 });
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    // @ts-expect-error The existing migration runner is intentionally a server-only .mjs module.
    const { runMigrations } = await import("../../../../../scripts/db-migrate.mjs");
    await runMigrations(sql);
    const applied = await sql`SELECT version FROM schema_migrations WHERE version = ${MIGRATION} LIMIT 1`;
    const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY(${sql.array(REQUIRED_TABLES)})`;
    const found = new Set(rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((table) => !found.has(table));
    if (applied.length !== 1 || missing.length > 0) return NextResponse.json({ ok: false, applied: false, missingTables: missing }, { status: 500 });
    return NextResponse.json({ ok: true, applied: true, migration: MIGRATION, requiredTables: REQUIRED_TABLES.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("phase13_migration_failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ message: "تعذر تطبيق migration" }, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
