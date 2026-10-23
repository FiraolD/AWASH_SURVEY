import { notFound } from "next/navigation";
import { locales, getMessages, getLocale, isLocale } from "@/lib/i18n";
import { SessionProvider } from "next-auth/react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const messages = getMessages(raw);
  return (
    <SessionProvider>
      <div data-locale={raw} data-messages={JSON.stringify(messages)}>
        {children}
      </div>
    </SessionProvider>
  );
}