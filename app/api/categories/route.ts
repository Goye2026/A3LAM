import { NextResponse } from "next/server";
import { personService } from "@/lib/services/personService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await personService.listCategories();
    return NextResponse.json({ categories }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "categories_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
