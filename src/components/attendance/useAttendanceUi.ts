"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  formatClock,
  formatDate,
  formatShortDate,
  formatTime,
  formatWeekday,
  getAttendanceCopy,
  type AttendanceLocale,
} from "@/lib/attendance-copy";

/** Shared locale access and formatters for authenticated attendance screens. */
export function useAttendanceUi() {
  const locale = useLocale() as AttendanceLocale;
  const copy = useMemo(() => getAttendanceCopy(locale), [locale]);
  const date = useCallback((value: string) => formatDate(value, locale), [locale]);
  const shortDate = useCallback((value: string) => formatShortDate(value, locale), [locale]);
  const weekday = useCallback((value: string) => formatWeekday(value, locale), [locale]);
  const time = useCallback(
    (value: string | null | undefined) => formatTime(value, locale),
    [locale]
  );
  const clock = useCallback(
    (value: string | null | undefined) => formatClock(value, locale),
    [locale]
  );
  return { locale, copy, date, shortDate, weekday, time, clock };
}
