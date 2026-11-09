"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "~db/index";
import { users } from "~db/schema";
import { revalidatePath } from "next/cache";

const DEFAULT_PASSWORD = "Insurance123";

export async function createUser(data: {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  branchId: number;
  preferredLang: string;
}) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await db.insert(users).values({
    username: data.username,
    email: data.email,
    fullName: data.fullName,
    phone: data.phone,
    role: data.role,
    branchId: data.branchId,
    preferredLang: data.preferredLang,
    passwordHash,
    mustChangePassword: true, // Force change on first login
    isActive: true,
  });

  revalidatePath("/admin/users");
}

export async function updateUser(data: {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  branchId: number;
  preferredLang: string;
}) {
  await db
    .update(users)
    .set({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      branchId: data.branchId,
      preferredLang: data.preferredLang,
    })
    .where(eq(users.id, data.id));

  revalidatePath("/admin/users");
}

export async function setUserActive(id: string, isActive: boolean) {
  await db.update(users).set({ isActive }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function resetUserPassword(id: string) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
    })
    .where(eq(users.id, id));

  revalidatePath("/admin/users");
}