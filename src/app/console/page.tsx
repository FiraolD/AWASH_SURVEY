import { cookies } from "next/headers";
import { ConsoleLogin } from "./ConsoleLogin";
import { SqlConsole } from "@/components/SqlConsole";
import { listMigrations } from "@/server/actions/sql";
import { logoutConsole } from "@/server/actions/console";

export const metadata = {
  title: "System Console",
  robots: "noindex, nofollow", // Prevents search engines from indexing this page
};

export default async function ConsolePage() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get("console_auth")?.value === "true";

  if (!isAuth) {
    return <ConsoleLogin />;
  }

  // Fetch migrations for the SQL Console
  const migrations = await listMigrations();

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 text-slate-200">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Database Console</h1>
            <p className="text-sm text-slate-400">Direct database access. Proceed with caution.</p>
          </div>
          <form action={logoutConsole}>
            <button
              type="submit"
              className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Lock Console
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <SqlConsole locale="en" migrations={migrations} />
        </div>
      </div>
    </div>
  );
}