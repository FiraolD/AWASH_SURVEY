import { notFound } from "next/navigation";
import { getReport } from "@/server/queries/reports";
import { getMessages } from "@/lib/i18n";
import { PrintSheet } from "@/components/PrintSheet";

export default async function PreviewPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await getReport(id);
  if (!data) notFound();
  const messages = getMessages(locale as any);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <a href={`/${locale}/reports/${id}`} className="rounded-md border border-line bg-white px-4 py-2 text-sm">
        ← {data.report.status === "finalized" ? "View report" : messages.app.back}
        </a>
        <a href={`/api/reports/${id}/pdf`} target="_blank" rel="noreferrer"
           className="rounded-md bg-acc px-4 py-2 text-sm text-white">
          ⬇ {messages.app.print}
        </a>
      </div>
      <PrintSheet locale={locale} messages={messages} report={data.report} items={data.items} />
    </div>
  );
}