/**
 * /admin/attendance/reports — attendance reports
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meeting, MeetingMemberRow, MeetingStats, RangeReport } from "@/lib/attendance";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import { useAttendanceUi } from "@/components/attendance/useAttendanceUi";
import {
  Banner,
  Card,
  EmptyState,
  PresentPill,
  Spinner,
  StatCard,
  inputClass,
  primaryBtn,
  subtleBtn,
  successBtn,
} from "@/components/attendance/ui";

/** Local (not UTC) YYYY-MM-DD helpers so the range never shifts a day. */
function pad2(n: number): string {
  return `${n}`.padStart(2, "0");
}
/** First day of the current month — the useful default "from" for the range report. */
function monthStartIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;
}
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function RangeView({ from, to, onChangeFrom, onChangeTo, data, loading, onRefresh, exporting, onExport }: {
  from: string; to: string;
  onChangeFrom: (v: string) => void; onChangeTo: (v: string) => void;
  data: RangeReport | null; loading: boolean; onRefresh: () => void;
  exporting: boolean;
  onExport: (meetingId: string, meetingDate: string) => void;
}) {
  const { copy, date } = useAttendanceUi();
  return (
    <Card
      title={`📅 ${copy.rangeReport}`}
      actions={
        <button type="button" onClick={onRefresh} disabled={loading} className={primaryBtn}>
          {loading ? copy.loading : copy.reportRefresh}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm text-blue-light/60">{copy.fromDate}</label>
          <input type="date" value={from} onChange={(e) => onChangeFrom(e.target.value)} className={inputClass} min="2020-01-01" max="2030-12-31" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-blue-light/60">{copy.toDate}</label>
          <input type="date" value={to} onChange={(e) => onChangeTo(e.target.value)} className={inputClass} min="2020-01-01" max="2030-12-31" />
        </div>
      </div>
      {loading && data && <p className="mt-4 text-xs text-blue-light/50">{copy.refreshing}</p>}
      {!from || !to || !data ? (
        !from || !to ? (
          <EmptyState icon="🗓️" title={copy.chooseDates} hint={copy.chooseDatesHint} />
        ) : loading ? (
          <Spinner label={copy.loadReport} />
        ) : (
          <EmptyState icon="📭" title={copy.noData} hint={copy.reportNoDataHint} />
        )
      ) : (
        <div className="mt-4">
          <div className="mb-4 flex flex-wrap gap-3">
            <StatCard label={copy.totalMembers} value={data.totals.totalMembers} icon="👥" className="bg-blue-dark/60" />
            <StatCard label={copy.presentMembers} value={data.totals.present} icon="✅" valueClassName="text-green-300" className="bg-green-500/15" />
            <StatCard label={copy.absentMembers} value={data.totals.absent} icon="❌" valueClassName="text-red-300" className="bg-red-500/15" />
            <StatCard label={copy.attendanceRate} value={`${data.totals.attendanceRate}%`} icon="📊" />
          </div>
          {data.meetings.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-white">{copy.meetingsInRange}</h3>
              <div className="overflow-auto rounded-xl border border-blue-mid/20">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-dark/40">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-light/70">{copy.date}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-light/70">{copy.meetingReport}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.presentMembers}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.absentMembers}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.reportRate}</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.reportExport}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.meetings.map((m) => (
                      <tr key={m.id} className="border-t border-blue-mid/10">
                        <td className="px-3 py-2 text-sm text-white">{date(m.meeting_date)}</td>
                        <td className="px-3 py-2 text-sm text-white">{m.title}</td>
                        <td className="px-3 py-2 text-center text-sm text-green-300">{m.stats.present}</td>
                        <td className="px-3 py-2 text-center text-sm text-red-300">{m.stats.absent}</td>
                        <td className="px-3 py-2 text-center text-sm text-white">{m.stats.attendanceRate}%</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" disabled={exporting} onClick={() => onExport(m.id, m.meeting_date)} className={successBtn}>
                            {exporting ? copy.loading : "📥"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon="📭" title={copy.noMeetings} hint={copy.tryFilters} />
          )}
        </div>
      )}
    </Card>
  );
}

/** Row shape of GET /api/attendance/reports (no params) — meetingSummaries()
 *  returns flat present/absent/rate counts (NO nested stats object). */
interface MeetingWithStats extends Meeting {
  present: number;
  absent: number;
  rate: number;
}

/** MeetingStats derived from a summary row (shown until the detail loads). */
function summaryStats(m: MeetingWithStats): MeetingStats {
  return {
    totalMembers: m.present + m.absent,
    present: m.present,
    absent: m.absent,
    attendanceRate: m.rate,
  };
}

type View = "range" | "meeting";
function MeetingView({ meetings, selectedId, onChangeId, data, loading, onRefresh, exporting, onExport }: {
  meetings: MeetingWithStats[]; selectedId: string;
  onChangeId: (v: string) => void;
  data: { meeting: Meeting; report: MeetingMemberRow[]; stats: MeetingStats } | null; loading: boolean;
  onRefresh: () => void; exporting: boolean;
  onExport: (meetingId: string, meetingDate: string) => void;
}) {
  const { copy, date, time } = useAttendanceUi();
  const selectedMeeting = useMemo(() => meetings.find((m) => m.id === selectedId) ?? null, [meetings, selectedId]);
  // Detail stats once loaded; until then derive them from the summary row.
  const stats = data?.stats ?? (selectedMeeting ? summaryStats(selectedMeeting) : null);
  return (
    <Card
      title={`📋 ${copy.meetingReport}`}
      actions={
        <button type="button" onClick={onRefresh} disabled={loading} className={primaryBtn}>
          {loading ? copy.loading : copy.reportRefresh}
        </button>
      }
    >
      <div className="mb-4">
        <label className="mb-2 block text-sm text-blue-light/60">{copy.selectMeetingReport}</label>
        <select value={selectedId} onChange={(e) => onChangeId(e.target.value)} className={`${inputClass} rounded-xl`}>
          <option value="">— {copy.selectMeetingReport} —</option>
          {meetings.map((m) => <option key={m.id} value={m.id}>{date(m.meeting_date)} — {m.title}</option>)}
        </select>
      </div>
      {loading && !data && <Spinner label={copy.loadReport} />}
      {stats && (
        <div className="mb-4 flex flex-wrap gap-3">
          <StatCard label={copy.totalMembers} value={stats.totalMembers} icon="👥" className="bg-blue-dark/60" />
          <StatCard label={copy.presentMembers} value={stats.present} icon="✅" valueClassName="text-green-300" className="bg-green-500/15" />
          <StatCard label={copy.absentMembers} value={stats.absent} icon="❌" valueClassName="text-red-300" className="bg-red-500/15" />
          <StatCard label={copy.attendanceRate} value={`${stats.attendanceRate}%`} icon="📊" />
        </div>
      )}
      {data && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{data.meeting.title} — {date(data.meeting.meeting_date)}</h3>
            <button type="button" disabled={exporting} onClick={() => onExport(data.meeting.id, data.meeting.meeting_date)} className={successBtn}>
              {exporting ? copy.loading : `📥 ${copy.exportExcel}`}
            </button>
          </div>
          <div className="overflow-auto rounded-xl border border-blue-mid/20">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-dark/40">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-light/70">{copy.name}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-light/70">{copy.code}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.time}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-light/70">{copy.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.report.map((row) => (
                  <tr key={row.member_id} className="border-t border-blue-mid/10">
                    <td className="px-3 py-2 text-sm text-white">{row.name}</td>
                    <td className="px-3 py-2 text-sm text-blue-light/70">{row.member_code}</td>
                    <td className="px-3 py-2 text-center text-sm text-white">{time(row.check_in_time)}</td>
                    <td className="px-3 py-2 text-center"><PresentPill present={row.present} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!data && !loading && !selectedMeeting && (
        <EmptyState icon="📋" title={copy.reportNoMeeting} hint={copy.reportNoMeetingHint} />
      )}
    </Card>
  );
}

export default function AttendanceReportsPage() {
  const { request, headers } = useAttendanceApi();
  const { copy } = useAttendanceUi();
  const [view, setView] = useState<View>("range");
  // Default to the current month so the range report loads useful data immediately.
  const [rangeFrom, setRangeFrom] = useState(monthStartIso);
  const [rangeTo, setRangeTo] = useState(todayIso);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [meetings, setMeetings] = useState<MeetingWithStats[]>([]);
  const [rangeData, setRangeData] = useState<RangeReport | null>(null);
  const [meetingData, setMeetingData] = useState<{
    meeting: Meeting;
    report: MeetingMemberRow[];
    stats: MeetingStats;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadMeetings = useCallback(async () => {
    const res = await request<{ meetings: MeetingWithStats[]; activeMeeting: Meeting | null }>("/api/attendance/reports");
    if (res.ok && res.data) {
      setMeetings(res.data.meetings);
      if (res.data.activeMeeting && !selectedMeetingId) setSelectedMeetingId(res.data.activeMeeting.id);
    } else setError(res.error ?? copy.requestFailed);
  }, [request, selectedMeetingId, copy.requestFailed]);

  const loadRange = useCallback(async () => {
    if (!rangeFrom || !rangeTo) return;
    setLoading(true);
    // The API wraps the payload: { range: { meetings, totals } }
    const res = await request<{ range: RangeReport }>(`/api/attendance/reports?from=${rangeFrom}&to=${rangeTo}`);
    setLoading(false);
    if (res.ok && res.data?.range) { setRangeData(res.data.range); setError(null); }
    else setError(res.error ?? copy.requestFailed);
  }, [request, rangeFrom, rangeTo, copy.requestFailed]);

  const loadMeeting = useCallback(async () => {
    if (!selectedMeetingId) return;
    setLoading(true);
    const res = await request<{ meeting: Meeting; report: MeetingMemberRow[]; stats: MeetingStats }>(`/api/attendance/reports?meetingId=${selectedMeetingId}`);
    setLoading(false);
    if (res.ok && res.data) { setMeetingData(res.data); setError(null); }
    else setError(res.error ?? copy.requestFailed);
  }, [request, selectedMeetingId, copy.requestFailed]);

  useEffect(() => {
    queueMicrotask(() => void loadMeetings());
  }, [loadMeetings]);
  useEffect(() => {
    if (view === "range") queueMicrotask(() => void loadRange());
  }, [view, loadRange]);
  useEffect(() => {
    if (view === "meeting") queueMicrotask(() => void loadMeeting());
  }, [view, loadMeeting]);

  const exportExcel = useCallback(async (meetingId: string, meetingDate: string) => {
    setExporting(true);
    const res = await fetch(`/api/attendance/export?meetingId=${meetingId}`, { headers });
    setExporting(false);
    if (!res.ok) { setNotice(`⚠️ ${copy.exportFailed}`); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${meetingDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice(`✅ ${copy.exportSuccess}`);
  }, [headers, copy.exportFailed, copy.exportSuccess]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white">📈 {copy.reports}</h2>
          <p className="text-xs text-blue-light/50">{copy.reportSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setView("range")} className={`${subtleBtn} ${view === "range" ? "bg-blue-accent text-white" : ""}`}>📅 {copy.rangeReport}</button>
          <button type="button" onClick={() => setView("meeting")} className={`${subtleBtn} ${view === "meeting" ? "bg-blue-accent text-white" : ""}`}>📋 {copy.meetingReport}</button>
          <Link href="/admin/attendance/dashboard" className={subtleBtn}>📊 {copy.dashboard}</Link>
          <Link href="/admin/attendance/meetings" className={subtleBtn}>{copy.reportBackMeetings}</Link>
        </div>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner tone="success">{notice}</Banner>}
      {view === "range" ? (
        <RangeView from={rangeFrom} to={rangeTo} onChangeFrom={setRangeFrom} onChangeTo={setRangeTo} data={rangeData} loading={loading} onRefresh={loadRange} exporting={exporting} onExport={exportExcel} />
      ) : (
        <MeetingView meetings={meetings} selectedId={selectedMeetingId} onChangeId={setSelectedMeetingId} data={meetingData} loading={loading} onRefresh={loadMeeting} exporting={exporting} onExport={exportExcel} />
      )}
    </>
  );
}


