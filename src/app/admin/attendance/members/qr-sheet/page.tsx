/**
 * /admin/attendance/members/qr-sheet — printable QR sheet for every member.
 *
 * One request returns all QR codes (as data URLs), then the page renders clean
 * cut-friendly cards: [QR] / Name / Code. Printing uses the browser dialog, so
 * there is nothing to install and no paid service involved.
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import { useAttendanceUi } from "@/components/attendance/useAttendanceUi";
import {
  Banner,
  EmptyState,
  Spinner,
  primaryBtn,
  subtleBtn,
} from "@/components/attendance/ui";

interface SheetCard {
  id: string;
  name: string;
  member_code: string;
  active: boolean;
  checkInUrl: string;
  dataUrl: string;
}

export default function QrSheetPage() {
  const { request } = useAttendanceApi();
  const { copy } = useAttendanceUi();
  const [cards, setCards] = useState<SheetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(true);

  const load = useCallback(
    async (activeOnly: boolean) => {
      setLoading(true);
      const res = await request<{ members: SheetCard[]; count: number }>(
        `/api/attendance/qr-sheet${activeOnly ? "" : "?onlyActive=0"}`
      );
      if (res.ok && res.data) {
        setCards(res.data.members);
        setError(null);
      } else {
        setError(res.error ?? copy.qrError);
      }
      setLoading(false);
    },
    [request, copy.qrError]
  );

  useEffect(() => {
    queueMicrotask(() => void load(onlyActive));
  }, [load, onlyActive]);

  return (
    <>
      {/* Screen-only controls — hidden when printing. */}
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">🖨️ {copy.qrSheet}</h2>
            <p className="text-xs text-blue-light/50">
              {copy.qrSheetHint}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyActive((v) => !v)}
              className={subtleBtn}
              title={copy.qrToggleHint}
            >
              {onlyActive ? copy.activeOnly : copy.allMembers}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={cards.length === 0}
              className={primaryBtn}
            >
              🖨️ {copy.printSheet}
            </button>
            <Link href="/admin/attendance/members" className={subtleBtn}>
              {copy.backMembers}
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <Banner tone="error">{error}</Banner>
          </div>
        )}
        {loading && <Spinner label={copy.qrGeneratingSheet} />}
        {!loading && cards.length === 0 && !error && (
          <EmptyState
            icon="🖨️"
            title={copy.noPrintableMembers}
            hint={copy.addMembersFirstQr}
          />
        )}
      </div>

      <div className="print-sheet grid grid-cols-2 gap-4 text-gray-900 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`qr-card ${card.active ? "" : "opacity-60"} rounded-xl border border-blue-mid/40 bg-white p-3 text-center break-inside-avoid`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL sheet */}
            <img
              src={card.dataUrl}
              alt={`QR ${card.name}`}
              className="mx-auto h-32 w-32 sm:h-36 sm:w-36"
            />
            <p className="mt-2 text-sm font-bold">{card.name}</p>
            <p className="text-xs tracking-widest text-gray-500">{card.member_code}</p>
          </div>
        ))}
      </div>
    </>
  );
}
