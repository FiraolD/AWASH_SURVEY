import "server-only";
import { sql } from "drizzle-orm";
import { db } from "~db/index";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Run `fn` inside a transaction with the audit context set.
 * Every INSERT/UPDATE/DELETE on `tx` is attributed to `actor`.
 *
 * `set_config(..., true)` scopes the setting to this transaction only,
 * so a pooled connection can't leak one request's actor into the next.
 */
export async function withActor<T>(
  actor: { id: string; email: string },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id',    ${actor.id},    true)`);
    await tx.execute(sql`SELECT set_config('app.user_email', ${actor.email}, true)`);
    return fn(tx);
  });
}