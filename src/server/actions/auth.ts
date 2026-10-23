"use server";

import { signOut } from "@/server/auth";

export async function doSignOut(locale: string) {
  await signOut({ redirectTo: `/${locale}/login` });
}