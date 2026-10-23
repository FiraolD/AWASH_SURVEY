import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";

// scripts/import-branches.ts → ../.env is the project root
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "..", ".env") });

// Defer client import until after dotenv loads.
const { db } = await import("../db/client");
const { branches } = await import("../db/schema");
const { BRANCHES } = await import("../db/seed/branches.data");

async function main() {
  console.log(`→ importing ${BRANCHES.length} branches`);

  // Sanity check: every code must satisfy the DB constraint
  // CHECK (code ~ '^[A-Z0-9]{2,8}$')
  const bad = BRANCHES.filter((b) => !/^[A-Z0-9]{2,8}$/.test(b.code));
  if (bad.length) {
    console.error("✗ Invalid codes (must be 2–8 uppercase letters/digits):");
    for (const b of bad) console.error(`   ${b.code}  ${b.en}`);
    process.exit(1);
  }

  // Duplicate-code check inside the file itself
  const seen = new Set<string>();
  const dups = BRANCHES.filter((b) =>
    seen.has(b.code) ? true : (seen.add(b.code), false),
  );
  if (dups.length) {
    console.error("✗ Duplicate codes in branches.data.ts:");
    for (const b of dups) console.error(`   ${b.code}`);
    process.exit(1);
  }

  // Upsert: insert new, update names of existing.
  let inserted = 0;
  let updated = 0;

  for (const b of BRANCHES) {
    const result = await db
      .insert(branches)
      .values({
        code: b.code,
        names: { en: b.en, am: b.am },
        isActive: true,
      })
      .onConflictDoUpdate({
        target: branches.code,
        set: {
          names: sql`excluded.names`,
        },
      })
      .returning({ code: branches.code });

    // We can't easily tell insert vs update from RETURNING, so
    // do a quick existence check for reporting.
    if (result.length) {
      const wasNew = await db.execute<{ exists: boolean }>(sql`
        select (xmax = 0) as exists from branches where code = ${b.code}
      `);
      if (wasNew.rows[0]?.exists) inserted++;
      else updated++;
    }
  }

  const [{ count }] = (
    await db.execute<{ count: number }>(sql`select count(*)::int as count from branches`)
  ).rows;

  console.log(`✓ done — ${inserted} inserted, ${updated} updated`);
  console.log(`  ${count} branches now in the database`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ import failed:", err);
  process.exit(1);
});