import "server-only";
import { ZodError } from "zod";
import { UserError, type ActionResult } from "@/lib/action-result";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function friendlyError(e: unknown): string {
  if (e instanceof UserError) return e.message;
  if (e instanceof ZodError) return e.issues[0]?.message ?? "Invalid input";

  const msg = e instanceof Error ? e.message : "";
  if (msg === "FORBIDDEN") return "You don't have permission to do this.";
  if (msg === "UNAUTHORIZED") return "Your session has expired. Please sign in again.";

  const pg: any = (e as any)?.cause ?? e; // drizzle wraps driver errors in .cause
  if (pg?.code === "23505") {
    const c = String(pg.constraint ?? "");
    if (c.includes("username")) return "That username is already taken.";
    if (c.includes("email")) return "That email is already in use.";
    return "That value already exists.";
  }
  if (pg?.code === "23503") return "This record is still referenced by other data.";
  if (pg?.code === "P0001" && typeof pg.message === "string") return pg.message; // RAISE EXCEPTION

  console.error("[action]", e);
  return "Something went wrong. Please try again.";
}

/** Run an action body and turn any failure into { ok:false, error }. Never throws. */
export async function safe<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}
