"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "./index";

// ── Context ──────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: async () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

interface LocaleProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(async (next: Locale) => {
    const { setLocaleAction } = await import("@/app/actions/set-locale");
    await setLocaleAction(next);
    setLocaleState(next);
    router.refresh();
  }, [router]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTranslation() {
  const { locale, setLocale } = useContext(LocaleContext);
  const dict = getTranslations(locale);

  const t = useCallback(
    (key: string): string => {
      const parts = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = dict;
      for (const part of parts) {
        if (value == null || typeof value !== "object") return key;
        value = value[part];
      }
      return typeof value === "string" ? value : key;
    },
    [dict]
  );

  return { t, locale, setLocale };
}
