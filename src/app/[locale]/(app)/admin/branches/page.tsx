import { requireRole } from "@/server/permissions";
import { listBranches } from "@/server/queries/branches";

export default async function AdminBranches({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  await requireRole("admin");
  const rows = await listBranches();
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Branches</h1>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase text-mut">
            <tr><th className="p-3">Code</th><th className="p-3">EN</th><th className="p-3">አማ</th><th className="p-3">Active</th></tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="p-3 font-mono">{b.code}</td>
                <td className="p-3">{b.names.en ?? ""}</td>
                <td className="p-3">{b.names.am ?? ""}</td>
                <td className="p-3">{b.isActive ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}