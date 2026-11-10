"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { users } from "~db/schema";
import { UserError, type ActionResult } from "@/lib/action-result";
import { safe } from "@/server/action-utils";
import { withActor, type Tx } from "@/server/audit";
import { requireRole } from "@/server/permissions";

const DEFAULT_PASSWORD = "Insurance123";

type UserPayload = {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  branchId: number;
  preferredLang: string;
};

const userInput = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Username may only contain letters, numbers, . _ and -"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
  fullName: z.string().trim().min(2, "Enter the full name").max(100),
  phone: z.string().trim().max(20, "Phone is too long"),
  role: z.enum(["admin", "supervisor", "surveyor"], { errorMap: () => ({ message: "Choose a role" }) }),
  branchId: z.number({ invalid_type_error: "Choose a branch" }).int().positive("Choose a branch"),
  preferredLang: z.enum(["am", "en", "om"]),
});

/** Active admins other than `excludingId` (so we never lock everyone out). */
async function otherActiveAdmins(tx: Tx, excludingId: string): Promise<number> {
  const r = await tx.execute<{ n: number }>(
    sql`select count(*)::int as n from users where role = 'admin' and is_active = true and id <> ${excludingId}::uuid`,
  );
  return r.rows[0]?.n ?? 0;
}

const refresh = () => revalidatePath("/[locale]/admin/users", "page");

export async function createUser(data: UserPayload): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireRole("admin");
    const v = userInput.parse(data);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await withActor({ id: actor.id, email: actor.email ?? "" }, async (tx) => {
      await tx.insert(users).values({
        ...v,
        phone: v.phone || null,
        passwordHash,
        mustChangePassword: true, // force change on first login
        isActive: true,
      });
    });
    refresh();
  });
}

export async function updateUser(data: UserPayload & { id: string }): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireRole("admin");
    const id = z.string().uuid().parse(data.id);
    const v = userInput.parse(data);

    await withActor({ id: actor.id, email: actor.email ?? "" }, async (tx) => {
      const [target] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target) throw new UserError("User not found.");

      if (target.role === "admin" && v.role !== "admin") {
        if (target.id === actor.id) throw new UserError("You can't remove your own admin role.");
        if ((await otherActiveAdmins(tx, target.id)) < 1)
          throw new UserError("At least one active admin is required.");
      }

      await tx
        .update(users)
        .set({ ...v, phone: v.phone || null })
        .where(eq(users.id, id));
    });
    refresh();
  });
}

export async function setUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireRole("admin");
    z.string().uuid().parse(id);

    await withActor({ id: actor.id, email: actor.email ?? "" }, async (tx) => {
      if (!isActive) {
        if (id === actor.id) throw new UserError("You can't deactivate your own account.");
        const [target] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
        if (target?.role === "admin" && (await otherActiveAdmins(tx, id)) < 1)
          throw new UserError("At least one active admin is required.");
      }
      await tx.update(users).set({ isActive }).where(eq(users.id, id));
    });
    refresh();
  });
}

export async function resetUserPassword(id: string): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireRole("admin");
    z.string().uuid().parse(id);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await withActor({ id: actor.id, email: actor.email ?? "" }, async (tx) => {
      await tx.update(users).set({ passwordHash, mustChangePassword: true }).where(eq(users.id, id));
    });
    refresh();
  });
}
