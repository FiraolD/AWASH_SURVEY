import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

// db/seed/seed.ts → ../../.env is the project root
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "..", "..", ".env") });

// Import AFTER dotenv has loaded, so db/client.ts sees DATABASE_URL
const { db } = await import("../client");
const { branches, languages, users } = await import("../schema");

async function main() {
  console.log("→ seeding languages");

  await db
    .insert(languages)
    .values([
      { code: "en", name: "English",     nativeName: "English",     isActive: true,  sortOrder: 1 },
      { code: "am", name: "Amharic",     nativeName: "አማርኛ",        isActive: true,  sortOrder: 2 },
      { code: "om", name: "Afaan Oromo", nativeName: "Afaan Oromoo", isActive: false, sortOrder: 3 },
    ])
    .onConflictDoNothing();

  console.log("→ seeding branches");

  await db
    .insert(branches)
    .values([
      { code: "ADD", names: { en: "Head Office",  am: "ዋና መ/ቤት" } },
      { code: "AWA", names: { en: "Awash Branch", am: "አዋሽ ቅርንጫፍ" } },
    ])
    .onConflictDoNothing();

  console.log("→ seeding users");

  const [headOffice] = await db
    .select()
    .from(branches)
    .where(eq(branches.code, "ADD"))
    .limit(1);

  if (!headOffice) {
    throw new Error("Head Office branch was not found after insert");
  }

  const passwordHash = await bcrypt.hash("changeme", 10);

  await db
    .insert(users)
    .values([
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@awash.example",
        fullName: "System Admin",
        role: "admin",
        branchId: headOffice.id,
        passwordHash,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "surv@awash.example",
        fullName: "Sample Surveyor",
        role: "surveyor",
        branchId: headOffice.id,
        passwordHash,
      },
    ])
    .onConflictDoNothing();

  const [{ langCount }] = await db
    .select({ langCount: sql<number>`count(*)::int` })
    .from(languages);
  const [{ branchCount }] = await db
    .select({ branchCount: sql<number>`count(*)::int` })
    .from(branches);
  const [{ userCount }] = await db
    .select({ userCount: sql<number>`count(*)::int` })
    .from(users);

  console.log(
    `✓ seed complete — ${langCount} languages, ${branchCount} branches, ${userCount} users (password = 'changeme')`,
  );
}

// from:
console.log("→ seeding branches");

await db
  .insert(branches)
  .values([
    { code: "ADD", names: { en: "Head Office",  am: "ዋና መ/ቤት" } },
    { code: "AWA", names: { en: "Awash Branch", am: "አዋሽ ቅርንጫፍ" } },
  ])
  .onConflictDoNothing();

// to:
console.log("→ seeding branches");

const { BRANCHES } = await import("./branches.data");
await db
  .insert(branches)
  .values(
    BRANCHES.map((b) => ({
      code: b.code,
      names: { en: b.en, am: b.am },
      isActive: true,
    })),
  )
  .onConflictDoNothing();

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ seed failed:", err);
    process.exit(1);
  });