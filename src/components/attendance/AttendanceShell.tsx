/**
 * Shell for every /admin/attendance/* screen: page header, admin actions and
 * the attendance navigation, inside the project's existing page gradient.
 *
 * `children` only renders for authenticated admins (AdminAuthProvider gates it).
 */
"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAttendanceLocale } from "./AttendanceI18nProvider";
import { useAttendanceApi } from "./AdminAuthProvider";
import AttendanceNav from "./AttendanceNav";
import { subtleBtn } from "./ui";

export default function AttendanceShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAttendanceApi();
  const { locale, toggleLocale } = useAttendanceLocale();
  const t = useTranslations("attendance");

  return (
    <div className="min-h-dvh px-3 py-5 page-gradient sm:px-4 sm:py-6" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">📋 {t("title")}</h1>
            <p className="text-xs text-blue-light/50">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLocale}
              className={subtleBtn}
              aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>
            <Link href="/admin" className={subtleBtn}>
              🛠 {t("backToAdmin")}
            </Link>
            <button type="button" onClick={logout} className={subtleBtn}>
              {t("logout")}
            </button>
          </div>
        </header>

        <div className="print:hidden">
          <AttendanceNav />
        </div>
        {children}
      </div>
    </div>
  );
}
