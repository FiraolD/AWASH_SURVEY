import Link from "next/link";
import { getLocale, getMessages } from "@/lib/i18n";
import { listReportsPaged } from "@/server/queries/reports";
import { listBranches } from "@/server/queries/branches";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ReportsFilterBar } from "@/components/ReportsFilterBar";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const messages = getMessages(await getLocale());
  const session = await auth();
  const branches = await listBranches();

  const { rows, total, page, pageSize } = await listReportsPaged({
    plate: sp.plate,
    chassis: sp.chassis,
    status: (sp.status as "draft" | "finalized" | "void" | undefined) || undefined,
    branchId: sp.branch ? Number(sp.branch) : undefined,
    dateFrom: sp.from,
    dateTo: sp.to,
    surveyorId: session!.user.role === "surveyor" ? session!.user.id : undefined,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: sp.size ? Number(sp.size) : 25,
  });

  const statusStyles: Record<string, string> = {
    draft: "bg-[color:var(--warn-2)] text-[color:var(--warn)]",
    finalized: "bg-[color:var(--success-2)] text-[color:var(--success)]",
    void: "bg-[color:var(--bg)] text-[color:var(--mut)]",
  };

  const coverageLabel: Record<string, string> = {
    comprehensive: "ሙሉ · Full",
    third_party: "ሦስተኛ · 3rd",
  };

  const coverageStyles: Record<string, string> = {
    comprehensive: "bg-[color:var(--acc-2)] text-[color:var(--acc)] border-[#b3d4f0]",
    third_party: "bg-[color:var(--warn-2)] text-[color:var(--warn)] border-[#fde68a]",
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {messages.reports.list}
          </h1>
          <p className="text-sm text-[color:var(--mut)]">
            {total.toLocaleString()} report{total === 1 ? "" : "s"} total
          </p>
        </div>
        <Link href={`/${locale}/reports/new`}>
          <Button
            variant="primary"
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            {messages.reports.new}
          </Button>
        </Link>
      </header>

      <ReportsFilterBar branches={branches} messages={messages} />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--line)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg)] text-left text-xs uppercase tracking-wide text-[color:var(--mut)]">
            <tr>
              <th className="px-4 py-3">Report no.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Plate</th>
              <th className="hidden px-4 py-3 md:table-cell">Chassis</th>
              <th className="hidden px-4 py-3 md:table-cell">Coverage</th>
              <th className="hidden px-4 py-3 lg:table-cell">Branch</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-2">
                    <p className="text-[color:var(--mut)]">
                      {messages.reports.empty}
                    </p>
                    <Link
                      href={`/${locale}/reports/new`}
                      className="inline-block text-sm font-medium text-[color:var(--acc)] hover:underline"
                    >
                      Create your first report →
                    </Link>
                  </div>
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[color:var(--line)] hover:bg-[color:var(--bg)]/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/reports/${r.id}`}
                    className="font-medium text-[color:var(--acc)] hover:underline"
                  >
                    {r.report_no ?? "Draft"}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.report_date}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {r.plate_no ?? "—"}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">
                  {r.chassis_no ?? "—"}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {r.coverage ? (
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium " +
                        coverageStyles[r.coverage]
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (r.coverage === "comprehensive"
                            ? "bg-[color:var(--acc)]"
                            : "bg-[color:var(--warn)]")
                        }
                      />
                      {coverageLabel[r.coverage]}
                    </span>
                  ) : (
                    <span className="text-xs text-[color:var(--mut)]">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-xs text-[color:var(--mut)] lg:table-cell">
                  {r.branch_code}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-[color:var(--line)]">
          <Pagination page={page} pageSize={pageSize} total={total} />
        </div>
      </div>
    </section>
  );
}