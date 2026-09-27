import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { putNotificationRecord } from "@/lib/notifications-history";
import {
  getInvitations,
  nextMeetingCairoISO,
} from "@/lib/invitations";
import { meetingConfig, siteConfig } from "@/config";
import { routing } from "@/i18n/routing";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Smart meeting-eve reminder: look up the actual invitation image
    // uploaded for the next meeting day (Cairo). Falls back to generic text
    // when nothing was uploaded that week — never skips silently.
    const nextMeeting = nextMeetingCairoISO();
    const invitations = await getInvitations();
    const match = invitations.find((i) => i.date === nextMeeting);

    const { schedule } = meetingConfig;
    const sentAt = new Date().toISOString();
    const headingAr = `دعوة اجتماع ${schedule.dayNameAr} ✝️`;
    const headingEn = `${schedule.dayNameEn} Meeting Invitation ✝️`;
    const messageAr = match
      ? `دعوة اجتماع ${schedule.dayNameAr} ${match.date} — الساعة ${schedule.timeLabelAr} — ${siteConfig.church.nameAr} 🙏`
      : `اجتماع ${schedule.dayNameAr} غداً — الساعة ${schedule.timeLabelAr} — ${siteConfig.church.nameAr} 🙏`;
    const messageEn = match
      ? `${schedule.dayNameEn} meeting invitation ${match.date} — ${schedule.timeLabelEn} — ${siteConfig.church.name} 🙏`
      : `${schedule.dayNameEn} meeting is tomorrow at ${schedule.timeLabelEn} — ${siteConfig.church.name} 🙏`;
    const url = `/${routing.defaultLocale}/events`;
    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      url,
      image: match?.url,
    });

    try {
      await putNotificationRecord({
        id: crypto.randomUUID(),
        sentAt,
        headingAr,
        headingEn,
        messageAr,
        messageEn,
        url,
        image: match?.url ?? null,
        onesignalId: result.id ?? null,
        status: "sent",
        recipients: result.recipients ?? null,
      });
    } catch (historyError) {
      console.warn(
        "[cron:meeting-reminder] notification sent but history save failed:",
        historyError
      );
    }

    return NextResponse.json({
      success: true,
      nextMeeting,
      usedImage: Boolean(match),
      result,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
