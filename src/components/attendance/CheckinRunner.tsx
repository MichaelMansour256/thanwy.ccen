/**
 * Public QR identity card.
 *
 * Rendered by /checkin/[token] — the URL a member's QR code points at. The
 * token IDENTIFIES the member; it never GRANTS permission to record. This
 * runner resolves the token once (read-only POST /api/checkin) and shows the
 * member their name, ID and current status. Recording attendance is
 * staff-only: an authenticated admin/servant confirms it from the scanner
 * screen, and POST /api/attendance/checkin re-validates the credentials
 * server-side before anything is written to Supabase.
 *
 * GET stays safe: prefetching, sharing and refreshing create nothing.
 */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, getAttendanceCopy, type AttendanceLocale } from "@/lib/attendance-copy";

interface IdentifyResponse {
  ok: boolean;
  status: "found" | "inactive_member" | "invalid_token" | "error";
  message?: string;
  member?: { name: string; member_code: string } | null;
  meeting?: { id?: string; title: string; meeting_date: string } | null;
  checked_in?: boolean;
  check_in_time?: string | null;
}

type State =
  | { kind: "loading" }
  | { kind: "result"; data: IdentifyResponse }
  | { kind: "network" };

export default function CheckinRunner({
  token,
  locale = "ar",
}: {
  token: string;
  locale?: "ar" | "en";
}) {
  const localeValue: AttendanceLocale = locale;
  const copy = getAttendanceCopy(localeValue);
  const isAr = localeValue === "ar";
  const headlines: Record<IdentifyResponse["status"], string> = {
    found: `🪪 ${copy.memberDetails}`,
    inactive_member: `⚠️ ${copy.inactiveMember}`,
    invalid_token: `❌ ${copy.invalidQr}`,
    error: `❌ ${copy.connectionFailed}`,
  };
  const subtitles: Partial<Record<IdentifyResponse["status"], string>> = {
    invalid_token: copy.invalidTokenHint,
    inactive_member: copy.inactiveMemberHint,
    error: copy.connectionHint,
  };

  const [state, setState] = useState<State>({ kind: "loading" });
  const submitted = useRef(false);

  const submit = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const data = (await res.json()) as IdentifyResponse;

      // A failed request with no structured body (e.g. 503 without JSON) is
      // treated as a connection problem, never as a raw error dump.
      if (!data || typeof data.status !== "string") {
        setState({ kind: "network" });
        return;
      }
      setState({ kind: "result", data });
    } catch {
      setState({ kind: "network" });
    }
  }, [token]);

  // Fire exactly once per mount. StrictMode remounts in dev are harmless:
  // this is a read-only identification — nothing is ever recorded here.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isAr ? "rtl" : "ltr";
  }, [isAr, locale]);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    void submit();
  }, [submit]);

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      dir={isAr ? "rtl" : "ltr"}
      lang={locale}
    >
      <div className="w-full max-w-sm rounded-3xl border border-blue-mid/40 bg-blue-primary/30 p-7 text-center shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex justify-end">
          <Link
            href={`/checkin/${encodeURIComponent(token)}?lang=${isAr ? "en" : "ar"}`}
            className="text-xs text-blue-light/60 underline underline-offset-2"
          >
            {isAr ? "English" : "العربية"}
          </Link>
        </div>
        {state.kind === "loading" && (
          <>
            <div className="mb-4 text-5xl" aria-hidden>
              ⏳
            </div>
            <h1 className="text-xl font-bold text-white">{copy.verifying}</h1>
            <p className="mt-2 text-sm text-blue-light/60">{copy.keepOpen}</p>
          </>
        )}

        {state.kind === "network" && (
          <>
            <div className="mb-4 text-5xl" aria-hidden>
              📶
            </div>
            <h1 className="text-xl font-bold text-white">{copy.connectionFailed}</h1>
            <p className="mt-2 text-sm text-blue-light/60">{copy.connectionHint}</p>
            <button
              type="button"
              onClick={() => void submit()}
              className="mt-6 w-full rounded-2xl bg-blue-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-mid"
            >
              {copy.retry}
            </button>
          </>
        )}

        {state.kind === "result" && (
          <>
            <h1 className="text-xl font-bold leading-relaxed text-white">
              {headlines[state.data.status] ?? "ℹ️"}
            </h1>

            {state.data.member && (
              <>
                <p className="mt-5 text-2xl font-bold text-white">{state.data.member.name}</p>
                <p className="mt-1 text-xs tracking-widest text-blue-light/50">
                  Attendance ID: {state.data.member.member_code}
                </p>
              </>
            )}

            {state.data.status === "found" && (
              <div className="mt-5 border-t border-blue-mid/25 pt-4">
                {state.data.checked_in ? (
                  <>
                    <p className="text-lg font-semibold text-green-300">
                      {copy.attendanceAlready}
                    </p>
                    <p className="mt-2 text-sm text-blue-light/60">
                      {copy.recordedAt}{" "}
                      <span className="font-semibold text-blue-light">
                        {formatTime(state.data.check_in_time, localeValue)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-white">
                    {copy.attendanceNotRecorded}
                  </p>
                )}

                {state.data.meeting ? (
                  <p className="mt-3 text-sm text-blue-light/70">
                    {copy.currentMeeting} {state.data.meeting.title} ·{" "}
                    {formatDate(state.data.meeting.meeting_date, localeValue)}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-blue-light/60">
                    {copy.noMeeting}
                  </p>
                )}
              </div>
            )}

            {subtitles[state.data.status] && (
              <p className="mt-4 text-sm text-blue-light/60">{subtitles[state.data.status]}</p>
            )}

            {state.data.status === "found" && (
              <p className="mt-5 border-t border-blue-mid/25 pt-4 text-xs leading-relaxed text-blue-light/50">
                {copy.staffOnly}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
