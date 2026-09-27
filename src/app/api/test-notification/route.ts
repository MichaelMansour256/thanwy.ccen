import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { putNotificationRecord } from "@/lib/notifications-history";
import { routing } from "@/i18n/routing";

export async function POST(req: Request) {
  // Authenticate the request - you can remove this for simple testing
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { headingAr, headingEn, messageAr, messageEn, url = `/${routing.defaultLocale}` } = body;

    if (!headingAr || !headingEn || !messageAr || !messageEn) {
      return NextResponse.json(
        {
          error: "Missing required fields. Need: headingAr, headingEn, messageAr, messageEn, and optional url",
          example: {
            headingAr: "اختبار إشعار",
            headingEn: "Test Notification",
            messageAr: "هذه رسالة اختبار",
            messageEn: "This is a test message",
            url: "/events",
          },
        },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      url,
    });

    try {
      await putNotificationRecord({
        id: crypto.randomUUID(),
        sentAt: new Date().toISOString(),
        headingAr,
        headingEn,
        messageAr,
        messageEn,
        url,
        image: null,
        onesignalId: result.id ?? null,
        status: "sent",
        recipients: result.recipients ?? null,
      });
    } catch (historyError) {
      console.warn(
        "[test-notification] notification sent but history save failed:",
        historyError
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send notification", details: String(error) },
      { status: 500 }
    );
  }
}