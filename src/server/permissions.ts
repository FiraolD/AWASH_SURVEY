import "server-only";
import { auth } from "./auth";
import type { User } from "~db/schema";

export type Role = User["role"];

export type Capability =
  | "report.view"
  | "report.edit"
  | "report.finalize"
  | "report.reopen"
  | "report.void"
  | "parts.view"
  | "parts.edit"
  | "users.manage"
  | "audit.view"
  | "sql.run";

/**
 * Role capabilities:
 *
 *   admin       everything
 *   supervisor  reports + parts + void
 *   surveyor    reports only (own reports)
 */
const CAPS: Record<Role, Capability[]> = {
  admin: [
    "report.view", "report.edit", "report.finalize", "report.reopen", "report.void",
    "parts.view", "parts.edit",
    "users.manage",
    "audit.view",
    "sql.run",
  ],
  supervisor: [
    "report.view", "report.edit", "report.finalize", "report.reopen", "report.void",
    "parts.view", "parts.edit",
  ],
  surveyor: [
    "report.view", "report.edit", "report.finalize", "report.reopen",
  ],
};

export function can(role: Role, capability: Capability): boolean {
  return CAPS[role]?.includes(capability) ?? false;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function requireRole(...allowed: Role[]) {
  const u = await requireUser();
  if (!allowed.includes(u.role)) throw new Error("FORBIDDEN");
  return u;
}

export async function requireCapability(capability: Capability) {
  const u = await requireUser();
  if (!can(u.role, capability)) throw new Error("FORBIDDEN");
  return u;
}