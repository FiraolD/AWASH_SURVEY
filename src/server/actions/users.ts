"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "~db/index";
import { users } from "~db/schema";
import { requireRole, requireUser } from "@/server/permissions";
import { withActor } from "@/server/audit";
import { z } from "zod";

/* ----------------------------------------------------------------- */
/* Schemas                                                           */
/* ----------------------------------------------------------------- */

const baseUser = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Must be a valid email")
    .max(120),
  fullName: z.string().trim().min(2, "Name is too short").max(120),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "supervisor", "surveyor"]),
  branchId: z.coerce.number().int().positive("Branch is required"),
  preferredLang: z.enum(["en", "am", "om"]).default("am"),
});

const createUserInput = baseUser.extend({
    password: z.string().min(6, "Password must be at least 6 characters").max(200),
  });

const updateUserInput = baseUser.extend({
  id: z.string().uuid(),
});

/* ----------------------------------------------------------------- */
/* Actions                                                           */
/* ----------------------------------------------------------------- */

export async function createUser(raw: unknown) {
  const admin = await requireRole("admin");
  const data = createUserInput.parse(raw);

  const result = await withActor(
    { id: admin.id, email: admin.email },
    async (tx) => {
      // Email uniqueness
      const existing = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      if (existing.length) {
        throw new Error("A user with that email already exists");
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const [row] = await tx
        .insert(users)
        .values({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone || null,
          role: data.role,
          branchId: data.branchId,
          preferredLang: data.preferredLang,
          passwordHash,
          isActive: true,
        })
        .returning({ id: users.id });

      return { id: row.id };
    },
  );

  revalidatePath("/admin/users");
  return result;
}

export async function updateUser(raw: unknown) {
  const admin = await requireRole("admin");
  const data = updateUserInput.parse(raw);

  const result = await withActor(
    { id: admin.id, email: admin.email },
    async (tx) => {
      const [target] = await tx
        .select()
        .from(users)
        .where(eq(users.id, data.id))
        .limit(1);
      if (!target) throw new Error("User not found");

      // Email uniqueness (allow keeping the same email)
      if (data.email !== target.email) {
        const other = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, data.email))
          .limit(1);
        if (other.length) {
          throw new Error("A user with that email already exists");
        }
      }

      // Guard: cannot demote the last admin
      if (target.role === "admin" && data.role !== "admin") {
        const [{ n }] = (
          await tx.execute<{ n: number }>(
            sql`select count(*)::int as n from users where role = 'admin' and is_active = true`,
          )
        ).rows;
        if (n <= 1) {
          throw new Error("Cannot change the role of the last active admin");
        }
      }

      await tx
        .update(users)
        .set({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone || null,
          role: data.role,
          branchId: data.branchId,
          preferredLang: data.preferredLang,
        })
        .where(eq(users.id, data.id));

      return { ok: true as const };
    },
  );

  revalidatePath("/admin/users");
  return result;
}

export async function setUserActive(userId: string, active: boolean) {
  const admin = await requireRole("admin");

  if (!active && userId === admin.id) {
    throw new Error("You cannot deactivate your own account");
  }

  const result = await withActor(
    { id: admin.id, email: admin.email },
    async (tx) => {
      const [target] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!target) throw new Error("User not found");

      if (!active && target.role === "admin") {
        const [{ n }] = (
          await tx.execute<{ n: number }>(
            sql`select count(*)::int as n from users where role = 'admin' and is_active = true`,
          )
        ).rows;
        if (n <= 1) {
          throw new Error("Cannot deactivate the last active admin");
        }
      }

      await tx.update(users).set({ isActive: active }).where(eq(users.id, userId));
      return { ok: true as const };
    },
  );

  revalidatePath("/admin/users");
  return result;
}

export async function resetUserPassword(userId: string, newPassword: string) {
    const admin = await requireRole("admin");
  
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

  const result = await withActor(
    { id: admin.id, email: admin.email },
    async (tx) => {
      const [target] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!target) throw new Error("User not found");

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await tx
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId));

      return { ok: true as const };
    },
  );

  revalidatePath("/admin/users");
  return result;
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
    const me = await requireUser();
  
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

  const result = await withActor(
    { id: me.id, email: me.email },
    async (tx) => {
      const [u] = await tx
        .select()
        .from(users)
        .where(eq(users.id, me.id))
        .limit(1);
      if (!u || !u.passwordHash) throw new Error("Account not found");

      const ok = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!ok) throw new Error("Current password is incorrect");

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await tx
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, me.id));

      return { ok: true as const };
    },
  );

  return result;
}