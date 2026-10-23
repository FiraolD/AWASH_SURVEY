import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "~db/index";
import { branches } from "~db/schema";

export async function listBranches() {
  return db.select().from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.code));
}