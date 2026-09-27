import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { putNotificationRecord } from "@/lib/notifications-history";
import { getVerseRef } from "@/lib/verse";
import { routing } from "@/i18n/routing";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ref = await getVerseRef();
    if (!ref) return NextResponse.json({ skipped: "No verse set" });

    const headingAr = "✨ آية الأسبوع";
    const headingEn = "✨ Verse of the Week";
    const message = `${ref.bookName} ${ref.chapter}:${ref.verse}`;
    const url = `/${routing.defaultLocale}/bible/verse`;
    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr: message,
      messageEn: message,
      url,
    });

    try {
      await putNotificationRecord({
        id: crypto.randomUUID(),
        sentAt: new Date().toISOString(),
        headingAr,
        headingEn,
        messageAr: message,
        messageEn: message,
        url,
        image: null,
        onesignalId: result.id ?? null,
        status: "sent",
        recipients: result.recipients ?? null,
      });
    } catch (historyError) {
      console.warn(
        "[cron:verse-notification] notification sent but history save failed:",
        historyError
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
