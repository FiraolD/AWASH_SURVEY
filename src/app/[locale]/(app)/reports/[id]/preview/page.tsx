import { notFound } from "next/navigation";
import { getReport } from "@/server/queries/reports";
import { auth } from "@/server/auth";
import { getMessages } from "@/lib/i18n";
import { PrintSheet } from "@/components/PrintSheet";

export default async function PreviewPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const data = await getReport(id);
  if (!data) notFound();
  if (session.user.role === "surveyor" && data.report.surveyorId !== session.user.id) notFound();
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
      <PrintSheet 
        locale={locale} 
        messages={messages} 
        report={data.report} 
        branchName={data.branchName} // <-- Added this
        items={data.items} 
      />
    </div>
  );
}