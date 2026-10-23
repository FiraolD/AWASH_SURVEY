import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "~db/index";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};
  let ok = true;

  // 1. DB connectivity + round-trip
  try {
    await db.execute(sql`SELECT 1`);
    checks.db = "up";
  } catch (err) {
    checks.db = "down";
    ok = false;
  }

  // 2. Migrations applied
  try {
    const { rows } = await db.execute<{ count: number }>(
      sql`SELECT count(*)::int AS count FROM _migrations`,
    );
    checks.migrations = `${rows[0].count} applied`;
  } catch {
    checks.migrations = "unknown";
  }

  // 3. Extensions present
  try {
    const { rows } = await db.execute<{ name: string }>(
      sql`SELECT name FROM pg_extension WHERE name IN ('pg_trgm','citext')`,
    );
    checks.extensions = rows.map((r) => r.name).sort().join(",") || "missing";
    if (!checks.extensions.includes("pg_trgm") || !checks.extensions.includes("citext")) {
      ok = false;
    }
  } catch {
    checks.extensions = "unknown";
  }

  // 4. Public assets present (fonts and logo)
  const { existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  checks.fonts = existsSync(join(process.cwd(), "public", "fonts", "NotoSansEthiopic-Regular.ttf")) ? "present" : "missing";
  checks.logo = existsSync(join(process.cwd(), "public", "logo.jpg")) ? "present" : "missing";

  const body = {
    status: ok ? "ok" : "degraded",
    uptime_s: Math.round(process.uptime()),
    latency_ms: Date.now() - start,
    checks,
  };

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}