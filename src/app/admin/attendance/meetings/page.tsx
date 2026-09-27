/**
 * /admin/attendance/meetings — open/close meetings and manage their dates.
 *
 * Attendance sessions live in ONE table (meetings + attendance), so "starting the
 * meeting" is just opening the current row: while it is open, scans are recorded
 * for it; when it is closed, scanning stops recording for that meeting. Opening a
 * meeting closes any other open one, so there is never more than one live session.
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meeting } from "@/lib/attendance";
import { meetingConfig } from "@/config";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import { useAttendanceUi } from "@/components/attendance/useAttendanceUi";
import {
  Banner,
  Card,
  EmptyState,
  Spinner,
  dangerBtn,
  inputClass,
  primaryBtn,
  subtleBtn,
  successBtn,
} from "@/components/attendance/ui";

interface MeetingRow extends Meeting {
  present: number;
  absent: number;
  rate: number;
}

const STATUS_ICON: Record<string, string> = {
  scheduled: "⏳",
  active: "🟢",
  closed: "🔴",
};

function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function AttendanceMeetingsPage() {
  const { request, headers } = useAttendanceApi();
  const { copy, date, weekday, locale } = useAttendanceUi();

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingSchema, setMissingSchema] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: locale === "en" ? meetingConfig.nameEn : meetingConfig.name,
    meeting_date: todayIso(),
    start_time: "",
    end_time: "",
    open: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await request<{ meetings: MeetingRow[]; activeMeeting: Meeting | null }>(
      "/api/attendance/meetings?withStats=1"
    );
    if (res.ok && res.data) {
      setMeetings(res.data.meetings);
      setActiveMeeting(res.data.activeMeeting);
      setError(null);
      setMissingSchema(false);
    } else {
      setError(res.error ?? copy.error);
      setMissingSchema(Boolean(res.missingSchema));
    }
    setLoading(false);
  }, [request, copy.error]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const create = useCallback(async () => {
    if (!form.title.trim() || !form.meeting_date) {
      setNotice(`⚠️ ${copy.meetingRequired}`);
      return;
    }
    const res = await request<Meeting>("/api/attendance/meetings", {
      json: {
        title: form.title,
        meeting_date: form.meeting_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        open: form.open,
      },
    });
    if (!res.ok) {
      setNotice(`⚠️ ${res.error ?? copy.requestFailed}`);
      return;
    }
    setNotice(`✅ ${form.open ? copy.createdOpen : copy.createdClosed}`);
    setShowCreate(false);
    void load();
  }, [request, form, load, copy]);

  const setStatus = useCallback(
    async (meeting: MeetingRow, action: "open" | "close") => {
      if (action === "close" && !window.confirm(`${copy.closeAttendance}: ${meeting.title}?`)) return;
      setBusyId(meeting.id);
      const res = await request<Meeting>("/api/attendance/meetings", {
        method: "PATCH",
        json: { id: meeting.id, action },
      });
      setBusyId(null);
      if (!res.ok) {
        setNotice(`⚠️ ${res.error ?? copy.requestFailed}`);
        return;
      }
      setNotice(
        `${action === "open" ? "🟢" : "🔴"} ${action === "open" ? copy.openedNotice : copy.closedNotice} — ${meeting.title}`
      );
      void load();
    },
    [request, load, copy]
  );

  const removeMeeting = useCallback(
    async (meeting: MeetingRow) => {
      const confirmed = window.confirm(
        `${copy.removeMeetingDetails}\n\n${meeting.title} · ${date(meeting.meeting_date)}`
      );
      if (!confirmed) return;
      const res = await request<{ ok: boolean }>(
        `/api/attendance/meetings?id=${encodeURIComponent(meeting.id)}`,
        { method: "DELETE" }
      );
      setNotice(res.ok ? `🗑️ ${copy.delete}` : `⚠️ ${res.error ?? copy.requestFailed}`);
      void load();
    },
    [request, load, copy, date]
  );

  const exportExcel = useCallback(
    async (meeting: MeetingRow) => {
      const res = await fetch(
        `/api/attendance/export?meetingId=${encodeURIComponent(meeting.id)}`,
        { headers }
      );
      if (!res.ok) {
        setNotice(`⚠️ ${copy.exportFailed}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-${meeting.meeting_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    [headers, copy.exportFailed]
  );

  const upcoming = useMemo(
    () => meetings.filter((m) => m.status === "scheduled").length,
    [meetings]
  );

  if (loading) return <Spinner label={copy.loading} />;

  if (missingSchema) {
    return (
      <Banner tone="warning">
        ⚠️ {copy.schemaMissing}
      </Banner>
    );
  }

  if (error) {
    return (
      <Banner tone="error">
        ⚠️ {error}
        <button type="button" className={`${subtleBtn} ms-3`} onClick={() => void load()}>
          🔄 {copy.retry}
        </button>
      </Banner>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">📅 {copy.meetings}</h1>
          <p className="mt-1 text-sm text-blue-light/60">{copy.meetingsSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/attendance/scan" className={successBtn}>
            📷 {copy.openScanner}
          </Link>
          <Link href="/admin/attendance/dashboard" className={subtleBtn}>
            📊 {copy.dashboard}
          </Link>
          <Link href="/admin/attendance/reports" className={subtleBtn}>
            📊 {copy.reports}
          </Link>
          <button type="button" className={primaryBtn} onClick={() => setShowCreate(true)}>
            ＋ {copy.createMeeting}
          </button>
        </div>
      </div>

      {notice && <Banner tone="info">{notice}</Banner>}

      {/* ── Active (open) meeting ── */}
      {activeMeeting ? (
        <Card
          title={`🟢 ${copy.activeMeeting}`}
          className="border-green-500/40"
          actions={
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
              🟢 {copy.openNow}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-blue-dark/60 p-3 text-center sm:col-span-2">
              <div className="text-lg font-bold text-white">
                {meetings.find((m) => m.id === activeMeeting.id)?.title ?? activeMeeting.title}
              </div>
              <div className="mt-1 text-xs text-blue-light/60">
                {weekday(activeMeeting.meeting_date)}
              </div>
            </div>
            <div className="rounded-xl bg-blue-dark/60 p-3 text-center">
              <div className="text-sm text-blue-light/60">⏰ {copy.meetingTime}</div>
              <div className="text-sm font-semibold text-white">
                {activeMeeting.start_time ?? "—"} – {activeMeeting.end_time ?? "—"}
              </div>
            </div>
            <div className="rounded-xl bg-blue-dark/60 p-3 text-center">
              <div className="text-sm text-blue-light/60">👥 {copy.attendanceCount}</div>
              <div className="text-sm font-semibold text-white">
                {meetings.find((m) => m.id === activeMeeting.id)?.present ?? 0} (
                {meetings.find((m) => m.id === activeMeeting.id)?.rate ?? 0}%)
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={dangerBtn}
              disabled={busyId === activeMeeting.id}
              onClick={() => {
                const row = meetings.find((m) => m.id === activeMeeting.id);
                if (row) void setStatus(row, "close");
              }}
            >
              🔴 {copy.closeAttendance}
            </button>
            <Link href="/admin/attendance/scan" className={successBtn}>
              📷 {copy.openScanner}
            </Link>
            <button
              type="button"
              className={subtleBtn}
              onClick={() => {
                const row = meetings.find((m) => m.id === activeMeeting.id);
                if (row) void exportExcel(row);
              }}
            >
              ⬇️ {copy.exportExcel}
            </button>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="📭"
          title={copy.noOpenMeeting}
          hint={copy.openMeetingFirst}
          action={
            <button type="button" className={primaryBtn} onClick={() => setShowCreate(true)}>
              🚀 {copy.startMeeting}
            </button>
          }
        />
      )}

      {/* ── Create form ── */}
      {showCreate && (
        <Card title={`➕ ${copy.newMeeting}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-blue-light/60">{copy.meetingTitle}</span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={copy.meetingTitlePlaceholder}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-blue-light/60">{copy.meetingDate}</span>
              <input
                type="date"
                className={inputClass}
                value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-blue-light/60">{copy.startTime}</span>
              <input
                type="time"
                className={inputClass}
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-blue-light/60">{copy.endTime}</span>
              <input
                type="time"
                className={inputClass}
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-blue-light/80">
            <input
              type="checkbox"
              checked={form.open}
              onChange={(e) => setForm({ ...form, open: e.target.checked })}
              className="h-4 w-4 accent-blue-accent"
            />
            {copy.openImmediately}
          </label>
          <div className="mt-4 flex gap-2">
            <button type="button" className={primaryBtn} onClick={() => void create()}>
              ✅ {copy.create}
            </button>
            <button type="button" className={subtleBtn} onClick={() => setShowCreate(false)}>
              {copy.cancel}
            </button>
          </div>
        </Card>
      )}

      {/* ── All meetings ── */}
      <Card
        title={`📋 ${copy.allMeetings} (${meetings.length})`}
        actions={
          upcoming > 0 ? (
            <span className="text-xs text-blue-light/60">⏳ {upcoming} {copy.upcomingNotStarted}</span>
          ) : undefined
        }
      >
        {meetings.length === 0 ? (
          <EmptyState
            icon="🗓️"
            title={copy.noMeetings}
            hint={copy.createFirstMeeting}
            action={
              <button type="button" className={primaryBtn} onClick={() => setShowCreate(true)}>
                ＋ {copy.createMeeting}
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {meetings.map((m) => (
              <li
                key={m.id}
                className={`rounded-xl border p-3 ${
                  m.status === "active"
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-blue-mid/30 bg-blue-dark/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-white">
                      {m.title}{" "}
                      <span className="ms-1 text-xs font-normal">
                        {STATUS_ICON[m.status] ?? ""}{m.status === "active" ? ` ${copy.open}` : m.status === "closed" ? ` ${copy.closed}` : ` ${copy.scheduled}`}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-blue-light/60">
                      {date(m.meeting_date)} · ⏰ {m.start_time ?? "—"} – {m.end_time ?? "—"} ·
                      ✅ {m.present} · ❌ {m.absent} · 📈 {m.rate}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.status === "scheduled" && (
                      <button
                        type="button"
                        className={successBtn}
                        disabled={busyId === m.id}
                        onClick={() => void setStatus(m, "open")}
                      >
                        🟢 {copy.openAttendance}
                      </button>
                    )}
                    {m.status === "active" && (
                      <button
                        type="button"
                        className={dangerBtn}
                        disabled={busyId === m.id}
                        onClick={() => void setStatus(m, "close")}
                      >
                        🔴 {copy.closeAttendance}
                      </button>
                    )}
                    {m.status === "active" && (
                      <Link href="/admin/attendance/scan" className={subtleBtn}>
                        📷 {copy.scan}
                      </Link>
                    )}
                    <button type="button" className={subtleBtn} onClick={() => void exportExcel(m)}>
                      ⬇️ {copy.exportExcel}
                    </button>
                    <button type="button" className={dangerBtn} onClick={() => void removeMeeting(m)}>
                      🗑️ {copy.delete}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}