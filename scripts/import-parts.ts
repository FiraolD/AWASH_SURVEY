import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { eq, sql } from "drizzle-orm";

// scripts/import-parts.ts → ../.env is the project root
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "..", ".env") });

// Deferred imports so db/client.ts sees DATABASE_URL
const { db } = await import("../db/client");
const { parts, partTranslations } = await import("../db/schema");
const { SAMPLE_PARTS } = await import("../db/seed/parts.sample");

type Row = { en: string; am: string };

function readWorkbook(path: string): Row[] {
  if (!existsSync(path)) {
    console.warn(`! ${path} not found — using ${SAMPLE_PARTS.length} sample parts`);
    return SAMPLE_PARTS;
  }

  const wb = XLSX.read(readFileSync(path));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
  });

  const rows: Row[] = [];
  for (const r of raw) {
    if (!Array.isArray(r)) continue;
    const en = String(r[0] ?? "").trim();
    const am = String(r[1] ?? "").trim();
    if (!en && !am) continue;
    if (/to be repaired/i.test(en)) continue; // header row
    rows.push({ en, am });
  }
  return rows;
}

async function upsertPart(row: Row) {
  const en = row.en.trim();
  const am = row.am.trim();
  if (!en && !am) return;

  let partId: string | undefined;

  if (en) {
    const existing = await db
      .select({ id: parts.id })
      .from(parts)
      .innerJoin(partTranslations, eq(partTranslations.partId, parts.id))
      .where(
        sql`${partTranslations.lang} = 'en' AND lower(${partTranslations.name}) = lower(${en})`,
      )
      .limit(1);
    if (existing.length) partId = existing[0].id;
  }

  if (!partId) {
    const [created] = await db
      .insert(parts)
      .values({ source: "excel_import" })
      .returning({ id: parts.id });
    partId = created.id;
  }

  if (en) {
    await db
      .insert(partTranslations)
      .values({ partId, lang: "en", name: en })
      .onConflictDoUpdate({
        target: [partTranslations.partId, partTranslations.lang],
        set: { name: en },
      });
  }

  if (am) {
    await db
      .insert(partTranslations)
      .values({ partId, lang: "am", name: am })
      .onConflictDoUpdate({
        target: [partTranslations.partId, partTranslations.lang],
        set: { name: am },
      });
  }
}

async function main() {
  const file = join(process.cwd(), "db", "seed", "parts.xlsx");
  const rows = readWorkbook(file);
  console.log(`→ importing ${rows.length} parts from ${existsSync(file) ? "parts.xlsx" : "sample data"}`);

  let done = 0;
  for (const row of rows) {
    await upsertPart(row);
    if (++done % 100 === 0) console.log(`   ${done}/${rows.length}`);
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(parts);

  console.log(`✓ done. ${total} parts now in the catalogue.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ import failed:", err);
    process.exit(1);
  });