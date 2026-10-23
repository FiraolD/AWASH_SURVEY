import { requireRole } from "@/server/permissions";
import { listUnmatchedCustomParts } from "@/server/queries/parts";

export default async function CustomParts({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  await requireRole("admin");
  const rows = await listUnmatchedCustomParts();
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Manually typed parts awaiting promotion</h1>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase text-mut">
            <tr><th className="p-3">English</th><th className="p-3">አማርኛ</th><th className="p-3">Times used</th><th className="p-3">Last used</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-mut">Nothing to review.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="p-3">{r.en ?? ""}</td>
                <td className="p-3">{r.am ?? ""}</td>
                <td className="p-3">{r.timesUsed}</td>
                <td className="p-3">{String(r.lastUsed ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}