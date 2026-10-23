import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { Pool } from "pg";

// db/migrate.ts → ../.env is the project root
const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env");
const result = config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env from:", envPath);
  console.error(result.error.message);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is empty after loading", envPath);
  process.exit(1);
}

// Log the URL with the password masked so you can see what's being used
const safeUrl = process.env.DATABASE_URL.replace(/:[^:@/]+@/, ":***@");
console.log("Using database:", safeUrl);

async function main() {
  const dir = join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.warn("No .sql files found in", dir);
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const f of files) {
      const { rowCount } = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [f],
      );
      if (rowCount) {
        console.log(`↷ ${f} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(dir, f), "utf8");
      console.log(`▶ ${f}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations(name) VALUES ($1)", [f]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("✓ migrations complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ migration failed:", err.message ?? err);
  process.exit(1);
});