import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALES, type Locale } from "./zod";

import en from "@/messages/en.json";
import am from "@/messages/am.json";
import om from "@/messages/om.json";

const MESSAGES = { en, am, om } as const;
export type Messages = typeof en;

export const locales = LOCALES;
export const defaultLocale: Locale = "am";

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const ck = c.get("locale")?.value;
  if (ck && isLocale(ck)) return ck;
  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  for (const tag of accept.split(",").map((s) => s.split(";")[0].trim())) {
    const short = tag.slice(0, 2).toLowerCase();
    if (isLocale(short)) return short;
  }
  return defaultLocale;
}

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES[defaultLocale];
}

export function t(m: Messages, path: string): string {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return path;
  }, m) as string;
}