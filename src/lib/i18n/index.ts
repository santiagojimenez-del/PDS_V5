// Server-safe exports (no "use client")
import en, { type Dictionary } from "./locales/en";
import es from "./locales/es";

export type Locale = "en" | "es";
export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function getTranslations(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}
