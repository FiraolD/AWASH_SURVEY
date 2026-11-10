"use client";
import { useEffect } from "react";

/** The root layout is shared by all locales, so keep <html lang> in sync with the URL. */
export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
