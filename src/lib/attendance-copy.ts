import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";

export type AttendanceLocale = "ar" | "en";
export type AttendanceCopy = Record<string, string>;

function parseDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3])
    );
  }
  return new Date(value);
}

function localeTag(locale: AttendanceLocale): string {
  return locale === "en" ? "en-US-u-nu-latn" : "ar-EG-u-nu-latn";
}

/** Shared locale-aware date/time formatting for attendance screens. */
export function formatDate(value: string, locale: AttendanceLocale): string {
  return parseDate(value).toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(value: string, locale: AttendanceLocale): string {
  return parseDate(value).toLocaleDateString(localeTag(locale), { day: "numeric", month: "short" });
}

export function formatWeekday(value: string, locale: AttendanceLocale): string {
  return parseDate(value).toLocaleDateString(localeTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatTime(value: string | null | undefined, locale: AttendanceLocale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatClock(value: string | null | undefined, locale: AttendanceLocale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Client-safe attendance translations. The admin tree gets its locale from
 * next-intl, while /checkin receives it as a prop because that route is outside
 * [locale]. Both paths therefore read the same message files.
 */
export function getAttendanceCopy(locale: AttendanceLocale): AttendanceCopy {
  return (locale === "en" ? enMessages : arMessages).attendance as AttendanceCopy;
}
