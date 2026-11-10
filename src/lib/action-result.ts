// Pure helpers (safe to import from client components).
// In production Next.js hides the message of any error thrown from a server action,
// so expected failures are RETURNED as { ok: false, error } and re-thrown on the client by unwrap().
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Throw this for expected, user-facing failures. */
export class UserError extends Error {}

export function unwrap<T>(r: ActionResult<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
