// Environment validation. Fails the process on boot if anything is
// missing or malformed — better to crash loudly at startup than to
// run with a broken AUTH_SECRET in production.

function required(name: string): string {
  const v = process.env[name];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`✗ Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string" || v.length === 0) return undefined;
  return v;
}

const ALLOW_SQL_CONSOLE = optional("ALLOW_SQL_CONSOLE") === "true";
const NODE_ENV = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "test"
  | "production";

const AUTH_SECRET = required("AUTH_SECRET");

// In production, refuse the known-bad placeholders
if (
  NODE_ENV === "production" &&
  (AUTH_SECRET.startsWith("change-me") ||
    AUTH_SECRET.includes("dev-only") ||
    AUTH_SECRET.length < 32)
) {
  throw new Error(
    "✗ AUTH_SECRET is missing, too short, or still the development placeholder. Generate a real one with: openssl rand -base64 32"
  );
}

const AUTH_URL = optional("AUTH_URL");
if (AUTH_URL && NODE_ENV === "production" && !AUTH_URL.startsWith("https://")) {
  // FIX: Allow HTTP for local/LAN IP addresses (like 10.x.x.x or 192.168.x.x)
  const isLocal = /^(http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.))/.test(AUTH_URL);
  
  if (!isLocal) {
    throw new Error(
      `✗ AUTH_URL must use HTTPS in production for public domains (got "${AUTH_URL}").`
    );
  }
}

const DEFAULT_LOCALE = (optional("DEFAULT_LOCALE") ?? "am") as
  | "en"
  | "am"
  | "om";

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  AUTH_SECRET,
  AUTH_URL,
  AUTH_TRUST_HOST: optional("AUTH_TRUST_HOST") ?? "true",
  NODE_ENV,
  NEXT_PUBLIC_APP_NAME: optional("NEXT_PUBLIC_APP_NAME") ?? "Awash Survey",
  DEFAULT_LOCALE,
  ALLOW_SQL_CONSOLE,
} as const;

export type Env = typeof env;