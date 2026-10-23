import { notFound } from "next/navigation";
import { getReport } from "@/server/queries/reports";
import { getLocale, getMessages } from "@/lib/i18n";
import { ReportForm } from "@/components/ReportForm";
import { listBranches } from "@/server/queries/branches";

export default async function ReportEditor({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const report = await getReport(id);
  if (!report) notFound();
  const branches = await listBranches();
  const messages = getMessages(await getLocale());

  return (
    <ReportForm
      locale={locale}
      messages={messages}
      report={report.report}
      items={report.items}
      branches={branches}
      readonly={report.report.status !== "draft"}
    />
  );
}