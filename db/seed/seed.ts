import { config } from "dotenv";
config({ path: ".env" });

async function seed() {
  console.log("🌱 Starting seed...");

  // Use dynamic imports so dotenv runs FIRST and loads DATABASE_URL
  const { db } = await import("../client");
  const { users, branches, languages } = await import("../schema");
  const { eq } = await import("drizzle-orm");
  const bcrypt = await import("bcryptjs");

  // 1. Seed Languages
  console.log("  - Seeding languages...");
  await db
    .insert(languages)
    .values([
      // FIX: Added nativeName to satisfy the NOT NULL constraint
      { code: "am", name: "Amharic", nativeName: "አማርኛ", isActive: true },
      { code: "en", name: "English", nativeName: "English", isActive: true },
      { code: "om", name: "Afaan Oromoo", nativeName: "Afaan Oromoo", isActive: true },
    ])
    .onConflictDoNothing();

  // 2. Seed a Default Branch (needed for the admin user)
  console.log("  - Seeding default branch...");
  await db
    .insert(branches)
    .values({
      code: "HQ",
      names: { en: "Awash Head Office", am: "አዋሽ ዋና መስሪያ ቤት" },
      isActive: true,
    })
    .onConflictDoNothing();

  // Fetch the branch ID we just created (or find the first available)
  const [defaultBranch] = await db.select().from(branches).limit(1);
  
  if (!defaultBranch) {
    throw new Error("Failed to find or create a default branch.");
  }

  // 3. Seed Admin User
  console.log("  - Seeding admin user...");
  
  // Check if admin already exists to prevent crashing
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.default.hash("Insurance123", 10);

    await db.insert(users).values({
      username: "admin",
      email: "admin@awash.example",
      fullName: "System Admin",
      passwordHash: passwordHash,
      role: "admin",
      branchId: defaultBranch.id,
      preferredLang: "am",
      isActive: true,
      mustChangePassword: false, 
    });

    console.log("    ✅ Admin user created (username: admin, password: Insurance123)");
  } else {
    console.log("    ⏭️ Admin user already exists, skipping.");
  }

  console.log("✅ Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:");
  console.error(err);
  process.exit(1);
});