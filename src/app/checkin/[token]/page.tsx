/**
 * /checkin/[token] — the URL a member's QR code points at.
 *
 * Server component: it only reads the token from the URL and renders the runner.
 * No database write happens here (see CheckinRunner) — a GET must stay safe to
 * prefetch, share and refresh.
 *
 * The token is the ONLY thing the QR carries: an opaque, cryptographically
 * random value. Member codes ("M001") are never used as credentials, and
 * regenerating a token invalidates the old QR immediately.
 */
import type { Metadata } from "next";
import CheckinRunner from "@/components/attendance/CheckinRunner";

export const metadata: Metadata = {
  title: "تسجيل الحضور",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const locale = query.lang === "en" ? "en" : "ar";

  return <CheckinRunner token={token} locale={locale} />;
}
