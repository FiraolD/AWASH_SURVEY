import en from "@/messages/en.json";
import am from "@/messages/am.json";

export const locales = ["en", "am", "om"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

const dictionaries: Record<string, any> = { 
  en: en || {}, 
  am: am || {} 
};

export type Messages = typeof am;

export function getMessages(locale: string): Messages {
  // Just return the nested JSON directly
  return (dictionaries[locale] || dictionaries.en) as Messages;
}

// FIX: Explicitly type the return value so LangSwitch accepts it
export function getLocale(): Locale {
  return "am"; 
}