"use server";

import "server-only";
import { Pool } from "pg";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { sql as drizzleSql } from "drizzle-orm";
import { db } from "~db/index";
import { auditLog } from "~db/schema";
import { requireRole } from "@/server/permissions";
import { env } from "@/lib/env";

/* ------------------------------------------------------------------ */
/* Connection: one-shot pool, never reused between requests            */
/* ------------------------------------------------------------------ */

async function withConnection<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 5000,
  });
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await pool.end();
  }
}

/* ------------------------------------------------------------------ */
/* Result normalization                                                */
/* ------------------------------------------------------------------ */

type ResultSet = {
  command: string;
  rowCount: number;
  rows: Record<string, unknown>[];
  columns: string[];
};

export type SqlRunResult = {
  ok: boolean;
  durationMs: number;
  readOnly: boolean;
  resultSets: ResultSet[];
  error?: string;
  errorPosition?: number;
};

/* ------------------------------------------------------------------ */
/* Destructive statement detection                                     */
/* ------------------------------------------------------------------ */

const DESTRUCTIVE = /\b(drop|truncate|alter\s+table|delete\s+from)\b/i;
const DELETE_WITHOUT_WHERE = /\bdelete\s+from\s+\S+\s*;?\s*$/im;

export async function analyzeSql(text: string) {
  const destructive = DESTRUCTIVE.test(text);
  const deleteAll = DELETE_WITHOUT_WHERE.test(text);
  const hasMultipleStatements = text.split(";").filter((s) => s.trim()).length > 1;
  return { destructive, deleteAll, hasMultipleStatements };
}

/* ------------------------------------------------------------------ */
/* runSql — the main entry point                                       */
/* ------------------------------------------------------------------ */

export async function runSql(input: {
  text: string;
  readOnly: boolean;
  confirmDestructive?: boolean;
}): Promise<SqlRunResult> {
  if (!env.ALLOW_SQL_CONSOLE) {
    throw new Error("SQL console is disabled on this server");
  }

  const user = await requireRole("admin");
  const text = input.text.trim();
  if (!text) throw new Error("Query is empty");

  const { destructive, deleteAll } = await analyzeSql(text);

  if (input.readOnly && destructive) {
    throw new Error(
      "Read-only mode cannot run DROP, TRUNCATE, ALTER, or DELETE. Toggle off read-only to proceed.",
    );
  }
  if (!input.readOnly && (destructive || deleteAll) && !input.confirmDestructive) {
    throw new Error("This query modifies or destroys data. Confirm to proceed.");
  }

  const start = Date.now();
  let result: SqlRunResult;

  try {
    result = await withConnection(async (client) => {
      await client.query("SET statement_timeout = '30s'");

      if (input.readOnly) {
        await client.query("BEGIN TRANSACTION READ ONLY");
        try {
          const raw = await client.query(text);
          const sets = normalize(raw);
          // Always rollback — nothing persists even if the query somehow wrote
          await client.query("ROLLBACK");
          return {
            ok: true,
            durationMs: Date.now() - start,
            readOnly: true,
            resultSets: sets,
          };
        } catch (err) {
          await client.query("ROLLBACK").catch(() => {});
          throw err;
        }
      } else {
        await client.query("BEGIN");
        try {
          const raw = await client.query(text);
          const sets = normalize(raw);
          await client.query("COMMIT");
          return {
            ok: true,
            durationMs: Date.now() - start,
            readOnly: false,
            resultSets: sets,
          };
        } catch (err) {
          await client.query("ROLLBACK").catch(() => {});
          throw err;
        }
      }
    });
  } catch (err) {
    const anyErr = err as { message?: string; position?: string };
    result = {
      ok: false,
      durationMs: Date.now() - start,
      readOnly: input.readOnly,
      resultSets: [],
      error: anyErr.message ?? String(err),
      errorPosition: anyErr.position ? Number(anyErr.position) : undefined,
    };
  }

  // Audit every execution, success or failure
  await db.insert(auditLog).values({
    actorId: user.id,
    actorEmail: user.email,
    entity: "sql_console",
    entityId: "execute",
    action: result.ok ? "EXECUTE" : "EXECUTE_FAILED",
    changes: null,
    diff: {
      sql: { from: null, to: text.slice(0, 2000) },
      read_only: { from: null, to: input.readOnly },
      duration_ms: { from: null, to: result.durationMs },
      row_count: {
        from: null,
        to: result.resultSets.reduce((n, s) => n + s.rowCount, 0),
      },
      ...(result.error
        ? { error: { from: null, to: result.error.slice(0, 500) } }
        : {}),
    },
    rowPk: { id: "execute" },
  });

  return result;
}

function normalize(raw: unknown): ResultSet[] {
  // pg returns an array when the query contains multiple statements
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((r: any) => ({
    command: String(r.command ?? "UNKNOWN"),
    rowCount: Number(r.rowCount ?? 0),
    rows: r.rows ?? [],
    columns: (r.fields ?? []).map((f: any) => f.name),
  }));
}

/* ------------------------------------------------------------------ */
/* Migration runner                                                    */
/* ------------------------------------------------------------------ */

export type MigrationFile = {
  name: string;
  applied: boolean;
  appliedAt: string | null;
};

export async function listMigrationStatus(): Promise<MigrationFile[]> {
  if (!env.ALLOW_SQL_CONSOLE) throw new Error("SQL console is disabled");
  await requireRole("admin");

  const dir = join(process.cwd(), "db", "migrations");
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    : [];

  const applied = new Map<string, string>();
  try {
    const { rows } = await db.execute<{ name: string; applied_at: string }>(
      drizzleSql`SELECT name, applied_at FROM _migrations`,
    );
    for (const r of rows) applied.set(r.name, r.applied_at);
  } catch {
    // _migrations doesn't exist yet — no applied migrations
  }

  return files.map((name) => ({
    name,
    applied: applied.has(name),
    appliedAt: applied.get(name) ?? null,
  }));
}

export async function runPendingMigration(name: string) {
  if (!env.ALLOW_SQL_CONSOLE) throw new Error("SQL console is disabled");
  const user = await requireRole("admin");

  // Prevent path traversal
  if (!/^[a-zA-Z0-9_\-]+\.sql$/.test(name)) {
    throw new Error("Invalid migration filename");
  }

  const dir = join(process.cwd(), "db", "migrations");
  const file = join(dir, name);
  if (!existsSync(file)) throw new Error(`Migration ${name} not found`);

  const body = readFileSync(file, "utf8");

  const start = Date.now();
  try {
    await withConnection(async (client) => {
      await client.query("BEGIN");
      try {
        await client.query(body);
        await client.query(
          "INSERT INTO _migrations(name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
          [name],
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      }
    });
  } catch (err) {
    await db.insert(auditLog).values({
      actorId: user.id,
      actorEmail: user.email,
      entity: "sql_migration",
      entityId: name,
      action: "FAILED",
      diff: {
        error: { from: null, to: (err as Error).message.slice(0, 500) },
      },
      rowPk: { id: name },
    });
    throw err;
  }

  await db.insert(auditLog).values({
    actorId: user.id,
    actorEmail: user.email,
    entity: "sql_migration",
    entityId: name,
    action: "APPLIED",
    diff: {
      duration_ms: { from: null, to: Date.now() - start },
    },
    rowPk: { id: name },
  });

  revalidatePath("/admin/sql");
  return { ok: true as const };
}