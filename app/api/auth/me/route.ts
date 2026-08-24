import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  return NextResponse.json({ user });
}
