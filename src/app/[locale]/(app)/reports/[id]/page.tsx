import { notFound } from "next/navigation";
import { getReport } from "@/server/queries/reports";
import { auth } from "@/server/auth";
import { getMessages } from "@/lib/i18n";
import type { Locale } from "@/lib/zod";
import { ReportForm } from "@/components/ReportForm";
import { listBranches } from "@/server/queries/branches";

export default async function ReportPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; 
  
  const session = await auth();
  if (!session?.user) return notFound();

  // Fetch report and branches in parallel
  const [data, branches] = await Promise.all([
    getReport(id),
    listBranches(),
  ]);

  if (!data) return notFound();
  if (session.user.role === "surveyor" && data.report.surveyorId !== session.user.id) return notFound();

  const messages = getMessages(locale as Locale);
  const readonly = data.report.status !== "draft";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.report.reportNo ?? (locale === "am" ? "ረቂቅ ሪፖርት" : "Draft Report")}
          </h1>
          <p className="text-sm text-[color:var(--mut)]">
            {data.branchName || "Awash Insurance"}
          </p>
        </div>
      </header>

      <ReportForm
        locale={locale}
        messages={messages}
        report={data.report}
        items={data.items}
        branches={branches}
        readonly={readonly}
      />
    </div>
  );
}