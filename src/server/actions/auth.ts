"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "~db/index";
import { users } from "~db/schema";
import { auth, signOut } from "@/server/auth";
import { revalidatePath } from "next/cache";

export async function changePassword(newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false, 
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/", "layout");
}

// FIX: Added the missing doSignOut function
export async function doSignOut(locale: string) {
  await signOut({ redirectTo: `/${locale}/login` });
}