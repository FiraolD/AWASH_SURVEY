"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CONSOLE_COOKIE,
  CONSOLE_PATH,
  checkRateLimit,
  clearRateLimit,
  clientKey,
  createConsoleToken,
  requestIsHttps,
  safeEqual,
} from "@/server/console-auth";

export async function loginConsole(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.CONSOLE_PASSWORD;

  if (!expected) {
    return { error: "CONSOLE_PASSWORD is not configured on the server." };
  }

  const key = await clientKey();
  const limit = checkRateLimit(key);
  if (!limit.ok) {
    return { error: `Too many attempts. Try again in ${limit.retryAfterMin} minute(s).` };
  }

  if (safeEqual(password, expected)) {
    clearRateLimit(key);
    const cookieStore = await cookies();
    cookieStore.set(CONSOLE_COOKIE, createConsoleToken(), {
      httpOnly: true,
      sameSite: "strict",
      secure: await requestIsHttps(),
      path: CONSOLE_PATH,
      maxAge: 60 * 60 * 8,
    });
    redirect("/console");
  }

  return { error: "Invalid password" };
}

export async function logoutConsole() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: CONSOLE_COOKIE, path: CONSOLE_PATH });
  redirect("/console");
}
