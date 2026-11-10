import { notFound } from "next/navigation";
import { locales, isLocale } from "@/lib/i18n";
import { HtmlLang } from "@/components/HtmlLang";

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

  return (
    <div data-locale={raw}>
      <HtmlLang locale={raw} />
      {children}
    </div>
  );
}
