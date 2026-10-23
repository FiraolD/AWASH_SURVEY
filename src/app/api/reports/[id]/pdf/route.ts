import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest } from "next/server";
import { getReport } from "@/server/queries/reports";
import { SurveyReportPdf } from "@/pdf/SurveyReportPdf";
import { auth } from "@/server/auth";
import { getMessages } from "@/lib/i18n";
import type { Locale } from "@/lib/zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const data = await getReport(id);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const lang = (data.report.printLang ?? "am") as Locale;
  const messages = getMessages(lang);

  const buffer = await renderToBuffer(
    SurveyReportPdf({
      locale: lang,
      messages,
      report: data.report,
      items: data.items,
    }),
  );

  // Buffer is a Uint8Array subclass at runtime, but TypeScript's
  // lib.dom.d.ts doesn't accept it directly as BodyInit. Wrapping it
  // as Uint8Array satisfies the type without copying bytes.
  const body = new Uint8Array(buffer);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.report.reportNo ?? "draft"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}