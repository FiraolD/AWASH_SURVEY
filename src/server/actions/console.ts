"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginConsole(formData: FormData) {
  const password = formData.get("password") as string;
  const expectedPassword = process.env.CONSOLE_PASSWORD;

  if (!expectedPassword) {
    throw new Error("CONSOLE_PASSWORD is not set in environment variables.");
  }

  if (password === expectedPassword) {
    const cookieStore = await cookies();
    cookieStore.set("console_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    redirect("/console");
  }

  return { error: "Invalid password" };
}

export async function logoutConsole() {
  const cookieStore = await cookies();
  cookieStore.delete("console_auth");
  redirect("/console");
}