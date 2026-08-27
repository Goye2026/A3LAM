import { NextResponse } from "next/server";
import { adminErrorResponse, requirePermissionPrincipal } from "@/lib/admin/http";
import { listMediaAssets } from "@/lib/media/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePermissionPrincipal(request, "media.read");
  if (gate.response) return gate.response;
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
    const items = await listMediaAssets({ query, status: "ready", visibility: "public", limit: 50 });
    return NextResponse.json({ items: items.map((item) => ({ id: item.id, publicUrl: item.publicUrl, originalName: item.originalName, altText: item.altText, mimeType: item.mimeType, sizeBytes: item.sizeBytes, width: item.width, height: item.height, license: item.license, sourceUrl: item.sourceUrl, visibility: item.visibility })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminErrorResponse(error); }
}
