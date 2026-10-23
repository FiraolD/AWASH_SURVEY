import { NextRequest, NextResponse } from "next/server";
import { searchParts } from "@/server/queries/parts";
import { auth } from "@/server/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") ?? 40));
  if (!q.trim()) return NextResponse.json({ items: [] });
  const items = await searchParts(q, limit);
  return NextResponse.json({ items });
}