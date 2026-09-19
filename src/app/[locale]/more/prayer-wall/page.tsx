"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";

type Prayer = { id: string; name: string; request: string; pray_count: number; created_at: string };

export default function PrayerWallPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [prayedIds, setPrayedIds] = useState<Set<string>>(() => {
    // Lazy initializer (SSR-safe): reading localStorage during render avoids
    // calling setState inside the effect below.
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("prayedIds");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    loadPrayers();
  }, []);

  function loadPrayers() {
    setLoading(true);
    setLoadError("");
    fetch("/api/prayer")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setPrayers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(
          isAr ? "تعذر تحميل طلبات الصلاة — حاول مرة أخرى" : "Failed to load prayer requests — please try again"
        );
        setLoading(false);
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/prayer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, request }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // A failed insert must never look like a successful submission.
        // Surface the server's own error message when present (e.g. "Supabase
        // is not configured") so the user knows *why* the 503 happened,
        // falling back to a localized generic message.
        const fallback = res.status === 503
          ? isAr ? "الخدمة غير متاحة حالياً — حاول لاحقاً" : "Service temporarily unavailable — please try again later"
          : isAr ? "حدث خطأ — حاول مرة أخرى" : "Something went wrong — please try again";
        setSubmitError(data.error || fallback);
        return;
      }
      setSubmitted(true);
      setName("");
      setRequest("");
    } catch {
      setSubmitError(isAr ? "خطأ في الاتصال — حاول مرة أخرى" : "Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePray(id: string) {
    if (prayedIds.has(id)) return;
    const res = await fetch("/api/prayer/pray", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    // Only count and remember the prayer after the database confirms it.
    if (!res.ok || data.pray_count === undefined) return;
    const newIds = new Set(prayedIds).add(id);
    setPrayedIds(newIds);
    localStorage.setItem("prayedIds", JSON.stringify([...newIds]));
    setPrayers((prev) => prev.map((p) => p.id === id ? { ...p, pray_count: data.pray_count } : p));
  }

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={isAr ? "جدار الصلاة" : "Prayer Wall"} icon="✝️" />

      <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto">

        {/* Submit form */}
        {submitted ? (
          <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-5 text-center" dir="rtl">
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-semibold text-white">{isAr ? "شكراً! طلبك قيد المراجعة" : "Thank you! Your request is under review"}</p>
            <p className="text-sm text-blue-light/60 mt-1">{isAr ? "سيظهر بعد موافقة الخادم" : "It will appear after servant approval"}</p>
            <button onClick={() => setSubmitted(false)}
              className="mt-3 text-sm text-blue-accent underline">
              {isAr ? "أضف طلباً آخر" : "Add another"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} dir="rtl"
            className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4 backdrop-blur-sm">
            <p className="font-semibold text-white mb-3">
              {isAr ? "✝️ شارك بطلب صلاة" : "✝️ Share a Prayer Request"}
            </p>
            <div className="flex flex-col gap-2">
              <input
                placeholder={isAr ? "اسمك (اختياري)" : "Your name (optional)"}
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-blue-dark/60 px-4 py-2 text-white placeholder-blue-light/40 outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent text-sm"
              />
              <textarea
                placeholder={isAr ? "اكتب طلب صلاتك هنا…" : "Write your prayer request here…"}
                value={request} onChange={(e) => setRequest(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-blue-dark/60 px-4 py-2 text-white placeholder-blue-light/40 outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent text-sm resize-none"
              />
              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}
              <button type="submit" disabled={submitting || !request.trim()}
                className="rounded-xl bg-blue-accent py-2 text-sm font-semibold text-white hover:bg-blue-mid disabled:opacity-50 transition">
                {submitting ? "…" : isAr ? "أرسل الطلب 🙏" : "Send Request 🙏"}
              </button>
            </div>
          </form>
        )}

        {/* Prayer cards */}
        {loading ? (
          <div className="flex justify-center pt-8 text-blue-light/50 text-sm">
            {isAr ? "جاري التحميل…" : "Loading…"}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center pt-8 gap-3">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm text-center text-red-400">{loadError}</p>
            <button
              onClick={loadPrayers}
              className="rounded-xl bg-blue-accent py-2 text-sm font-semibold text-white hover:bg-blue-mid transition"
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : prayers.length === 0 ? (
          <div className="flex flex-col items-center pt-8 gap-2 text-blue-light/40">
            <span className="text-4xl">✝️</span>
            <p className="text-sm">{isAr ? "لا توجد طلبات صلاة بعد" : "No prayer requests yet"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prayers.map((prayer) => {
              const prayed = prayedIds.has(prayer.id);
              const date = new Date(prayer.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                month: "short", day: "numeric",
              });
              return (
                <div key={prayer.id} dir="rtl"
                  className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{prayer.name}</p>
                      <p className="text-xs text-blue-light/40">{date}</p>
                    </div>
                    <button onClick={() => handlePray(prayer.id)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition shrink-0 ${
                        prayed
                          ? "bg-blue-accent/20 text-blue-accent cursor-default"
                          : "bg-blue-primary/60 text-blue-light/70 hover:bg-blue-accent/20 hover:text-blue-accent"
                      }`}>
                      🙏 {prayer.pray_count}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-white/80">{prayer.request}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
