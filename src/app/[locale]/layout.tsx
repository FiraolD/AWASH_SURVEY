import { notFound } from "next/navigation";
import { locales, getMessages, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  
  if (!isLocale(raw)) {
    notFound();
  }
  
  const messages = getMessages(raw);

return (
  <div data-locale={raw}>
    {children}
  </div>
);
}