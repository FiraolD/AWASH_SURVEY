import { redirect } from "next/navigation";
import { requireUser } from "@/server/permissions";
import { createDraftReport } from "@/server/actions/reports";

export default async function NewReport({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireUser();
  const id = await createDraftReport(user.id, user.branchId ?? 1);
  redirect(`/${locale}/reports/${id}`);
}