import "server-only";
import { auth } from "./auth";
import { isConsoleAuthed } from "./console-auth";

export type Role = "admin" | "supervisor" | "surveyor";

export type Capability =
  | "reports.view"
  | "reports.edit"
  | "reports.finalize"
  | "reports.reopen"
  | "reports.void"
  | "parts.view"
  | "parts.edit"
  | "users.manage"
  | "audit.view"
  | "sql.run";

const MATRIX: Record<Role, Capability[]> = {
  admin: [
    "reports.view", "reports.edit", "reports.finalize", "reports.reopen", "reports.void",
    "parts.view", "parts.edit", "users.manage", "audit.view", "sql.run"
  ],
  supervisor: [
    "reports.view", "reports.edit", "reports.finalize", "reports.reopen", "reports.void",
    "parts.view", "parts.edit"
  ],
  surveyor: [
    "reports.view", "reports.edit", "reports.finalize", "reports.reopen"
  ],
};

export function can(role: Role | string | undefined, cap: Capability): boolean {
  if (!role) return false;
  return MATRIX[role as Role]?.includes(cap) ?? false;
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    // The /console page has its own password and a SIGNED cookie (see console-auth.ts).
    if (await isConsoleAuthed()) {
      return {
        id: "00000000-0000-0000-0000-000000000000",
        email: "console@system.local",
        role: "admin",
        name: "Console Admin",
      } as any;
    }
    throw new Error("UNAUTHORIZED");
  }

  return session.user;
}

export async function requireRole(roles: string | string[]) {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  
  if (!allowed.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  
  return user;
}

// FIX: Added the missing requireCapability function
export async function requireCapability(cap: Capability) {
  const user = await requireUser();
  
  if (!can(user.role, cap)) {
    throw new Error("FORBIDDEN");
  }
  
  return user;
}