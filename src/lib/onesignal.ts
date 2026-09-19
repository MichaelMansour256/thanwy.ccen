import { siteConfig } from "@/config";
import { routing } from "@/i18n/routing";

/**
 * OneSignal answers HTTP 200 with these error strings whenever the resolved
 * audience contains no push subscription. Two very different situations look
 * identical here:
 *   1. nobody has subscribed yet (users never tapped "Enable"), or
 *   2. the OneSignal app cannot create subscriptions at all — its Web platform
 *      is not configured, so `OneSignal.init()` fails in the browser with
 *      "App not configured for web push" and no subscription is ever created.
 * Both end up as this error, so the message names both causes instead of
 * blaming only the users. The prefix is kept stable because
 * /api/admin/notify string-matches it to label the history record
 * `failed_no_subscribers`.
 */
function noSubscribersError(): Error {
  return new Error(
    "No subscribed devices are currently available. " +
      "Users may have unsubscribed, blocked push, or not yet subscribed. " +
      "Have them open the site and accept the notification prompt. " +
      "If no device has ever registered, check that the OneSignal app has a " +
      "Web platform with a Site URL configured (otherwise the browser SDK " +
      "fails with \"App not configured for web push\")."
  );
}

function mentionsNoSubscribers(errors: string[]): boolean {
  return errors.some(
    (e) =>
      e.includes("not subscribed") ||
      e.includes("no subscribers") ||
      e.includes("No players")
  );
}

export async function sendNotification({
  headingAr,
  headingEn,
  messageAr,
  messageEn,
  url = `/${routing.defaultLocale}`,
  image,
}: {
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url?: string;
  image?: string;
}) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey) {
    throw new Error(
      `Missing OneSignal env vars. Have: APP_ID=${!!appId}, API_KEY=${!!apiKey}`
    );
  }

  const siteUrl = siteConfig.url;
  const fullUrl = /^https?:\/\//i.test(url) ? url : `${siteUrl}${url}`;

  const body = {
    app_id: appId,
    target_channel: "push",
    // v16 targeting = "every user OneSignal knows about (i.e. every push
    // subscription)". `filters` is used instead of the "Subscribed Users"
    // segment so targeting never depends on a dashboard segment name.
    //
    // AUDIT NOTE: the previous comment here claimed the "Subscribed Users"
    // segment no longer resolves for Web SDK v16 subscriptions. That was a
    // misdiagnosis — every segment AND every filter (including a deliberately
    // invalid filter field) returns the same
    // "All included players are not subscribed" while the app has zero
    // subscriptions. The real cause was always "no subscriptions", not the
    // targeting method. Both methods are documented and valid.
    filters: [{ field: "session_count", relation: "exists" }],
    headings: { en: headingEn, ar: headingAr },
    contents: { en: messageEn, ar: messageAr },
    // `web_url` is the field the Web SDK service worker uses for click-through.
    // Do NOT send `url` alongside `web_url`; OneSignal rejects: "Remove url
    // field when setting app_url or web_url".
    web_url: fullUrl,
    chrome_web_icon: `${siteUrl}/app-icon.png`,
    chrome_icon: `${siteUrl}/app-icon.png`,
    firefox_icon: `${siteUrl}/app-icon.png`,
    // Large invitation image (Android big picture + Chrome/Firefox large icon).
    // Only included when the caller passes one (Thursday invitation cron).
    ...(image
      ? {
          big_picture: image,
          chrome_big_picture: image,
          ios_attachments: { id: image },
        }
      : {}),
  };

  console.log("OneSignal request:", {
    appId: appId.substring(0, 8) + "...",
    url: fullUrl,
  });

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // AUDIT NOTE: ONESIGNAL_API_KEY is a *new-format* App API key
      // (os_v2_…). OneSignal's docs document `Authorization: Key <key>` for
      // those keys, but the legacy `Basic <key>` scheme is still accepted and
      // was verified working against api.onesignal.com for both GET and POST
      // (auth failures answer 401 / "Access denied"), so the scheme is left
      // unchanged rather than switched on an unverified assumption.
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { rawResponse: await res.text() };
  }

  console.log("OneSignal response status:", res.status, "body:", JSON.stringify(data).substring(0, 500));

  // OneSignal returns 200 even when the target resolves to 0 recipients.
  // Surface that as a clear "no subscribers" case rather than a generic 500.
  if (!res.ok) {
    // HTTP error (not 200)
    const errors = (data as { errors?: string[] }).errors ?? [];
    if (mentionsNoSubscribers(errors)) {
      throw noSubscribersError();
    }
    throw new Error(
      `OneSignal API error (HTTP ${res.status}): ${JSON.stringify(data)}`
    );
  }

  // Check if OneSignal returned errors in the response body (even with 200)
  // This happens when the notification was "created" but couldn't be delivered
  const responseErrors = data?.errors;
  if (Array.isArray(responseErrors) && responseErrors.length > 0) {
    const errors = responseErrors as string[];
    if (mentionsNoSubscribers(errors)) {
      throw noSubscribersError();
    }
    // Other errors - still throw but with the actual error message
    throw new Error(`OneSignal notification errors: ${JSON.stringify(errors)}`);
  }

  // Success - notification was created and delivered
  // OneSignal response includes: id, recipients, etc.
  console.log("OneSignal notification sent successfully, id:", data?.id);
  return data;
}

