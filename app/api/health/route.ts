import { NextResponse } from "next/server";
import { getHealthResponse } from "@/lib/observability/health";

export function GET() {
  return NextResponse.json(getHealthResponse(), { status: 200 });
}
