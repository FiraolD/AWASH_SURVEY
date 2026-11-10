import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { env } from "@/lib/env";

export const CONSOLE_COOKIE = "console_auth";
export const CONSOLE_PATH = "/console";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const sign = (payload: string) =>
  createHmac("sha256", env.AUTH_SECRET).update("console:" + payload).digest("base64url");

/** Token = "<expiryMs>.<hmac>". It cannot be forged without AUTH_SECRET. */
export function createConsoleToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyConsoleToken(token?: string | null): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isConsoleAuthed(): Promise<boolean> {
  return verifyConsoleToken((await cookies()).get(CONSOLE_COOKIE)?.value);
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Only mark the cookie Secure when the site is really served over HTTPS (LAN installs are often plain HTTP). */
export async function requestIsHttps(): Promise<boolean> {
  const proto = (await headers()).get("x-forwarded-proto");
  return proto === "https" || !!env.AUTH_URL?.startsWith("https://");
}

/* ---- tiny in-memory brute-force limiter (per server process) ---- */
const attempts = new Map<string, { n: number; reset: number }>();

export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export function checkRateLimit(key: string, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.reset < now) {
    attempts.set(key, { n: 1, reset: now + windowMs });
    return { ok: true, retryAfterMin: 0 };
  }
  rec.n += 1;
  if (rec.n > max) return { ok: false, retryAfterMin: Math.ceil((rec.reset - now) / 60000) };
  return { ok: true, retryAfterMin: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
