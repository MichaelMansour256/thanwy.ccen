"use client";

import { NextIntlClientProvider } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";

const STORAGE_KEY = "thanwy_attendance_locale";
type AttendanceLocale = "ar" | "en";
type AttendanceLocaleContextValue = {
  locale: AttendanceLocale;
  toggleLocale: () => void;
};

const AttendanceLocaleContext = createContext<AttendanceLocaleContextValue | null>(null);

export function useAttendanceLocale(): AttendanceLocaleContextValue {
  const value = useContext(AttendanceLocaleContext);
  if (!value) {
    throw new Error("useAttendanceLocale() must be used inside <AttendanceI18nProvider>");
  }
  return value;
}

/** The admin section is outside [locale], so it owns a small persisted locale
 * provider. The default remains the site's Arabic-first setting. */
export default function AttendanceI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<AttendanceLocale>("ar");

  const toggleLocale = useCallback(() => {
    setLocale((current) => {
      const next = current === "ar" ? "en" : "ar";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing can deny localStorage; the in-memory switch still works.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "ar") setLocale(saved);
      } catch {
        // Private browsing can deny localStorage; Arabic remains the safe default.
      }
    });
  }, []);

  const messages = locale === "en" ? enMessages : arMessages;
  const contextValue = useMemo(() => ({ locale, toggleLocale }), [locale, toggleLocale]);
  return (
    <AttendanceLocaleContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </AttendanceLocaleContext.Provider>
  );
}

export { STORAGE_KEY };
