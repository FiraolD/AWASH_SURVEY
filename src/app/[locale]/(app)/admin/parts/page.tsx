import { requireRole } from "@/server/permissions";
import { listPartsPaged } from "@/server/queries/parts";
import { AdminPartsTable } from "@/components/AdminPartsTable";
import { requireCapability } from "@/server/permissions";

export default async function AdminPartsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; active?: string; page?: string; size?: string }>;
}) {
  await params;
  await requireCapability("parts.view");
  const sp = await searchParams;

  const { rows, total, page, pageSize } = await listPartsPaged({
    q: sp.q,
    active: (sp.active as "all" | "active" | "inactive") ?? "all",
    page: sp.page ? Number(sp.page) : 1,
    pageSize: sp.size ? Number(sp.size) : 25,
  });

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parts catalogue</h1>
          <p className="text-sm text-[color:var(--mut)]">
            {total.toLocaleString()} parts · used by surveyors when creating reports
          </p>
        </div>
      </header>

      <AdminPartsTable
        rows={rows.map((r) => ({
          id: r.id,
          code: r.code,
          en: r.en ?? "",
          am: r.am ?? "",
          isActive: r.is_active,
          usageCount: r.usage_count,
          source: r.source,
        }))}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </section>
  );
}