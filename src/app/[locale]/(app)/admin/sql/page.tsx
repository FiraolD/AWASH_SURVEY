import { redirect } from "next/navigation";
import { requireRole } from "@/server/permissions";
import { env } from "@/lib/env";
import { listMigrationStatus } from "@/server/actions/sql";
import { SqlConsole } from "@/components/SqlConsole";

export default async function SqlPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("admin");

  if (!env.ALLOW_SQL_CONSOLE) {
    return (
      <div className="rounded-xl border border-[color:var(--line)] bg-white p-8 text-center">
        <h1 className="text-lg font-semibold">SQL console is disabled</h1>
        <p className="mt-2 text-sm text-[color:var(--mut)]">
          Set <code className="rounded bg-[color:var(--bg)] px-1.5 py-0.5 font-mono text-xs">ALLOW_SQL_CONSOLE=true</code>{" "}
          in <code className="rounded bg-[color:var(--bg)] px-1.5 py-0.5 font-mono text-xs">.env</code> and restart the
          server to enable it.
        </p>
      </div>
    );
  }

  const migrations = await listMigrationStatus();

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === "am" ? "የዳታቤዝ መሳሪያ" : "Database tools"}
        </h1>
        <p className="text-sm text-[color:var(--mut)]">
          {locale === "am"
            ? "ማይግሬሽኖችን ያስኪዱ፣ ወይም ጥያቄዎችን በቀጥታ ያሂዱ።"
            : "Apply migrations or run ad-hoc queries against the database."}
        </p>
      </header>

      <div className="rounded-[var(--r-lg)] border border-[#fde68a] bg-[color:var(--warn-2)] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--warn)] text-sm font-bold text-white">
            !
          </span>
          <div className="text-sm text-[color:var(--warn)]">
            <p className="font-semibold">
              {locale === "am"
                ? "ይህ መሳሪያ ኃይለኛ ነው"
                : "This tool is powerful"}
            </p>
            <p className="mt-1 opacity-90">
              {locale === "am"
                ? "ማንኛውም ጥያቄ ዳታቤዙን ሊቀይር ወይም ሊያጠፋ ይችላል። ተጠንቀቁ። ሁሉም ጥያቄዎች በኦዲት ሎግ ይመዘገባሉ።"
                : "Any query can modify or destroy the database. Be careful. Every query is logged to the audit trail."}
            </p>
          </div>
        </div>
      </div>

      <SqlConsole locale={locale} migrations={migrations} />
    </section>
  );
}