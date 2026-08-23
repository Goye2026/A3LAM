import { NextResponse } from "next/server";
import { getHealthResponse } from "@/lib/observability/health";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getHealthResponse(), {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
