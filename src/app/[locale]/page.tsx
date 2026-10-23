import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function LocaleIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  redirect(session?.user ? `/${locale}/reports` : `/${locale}/login`);
}