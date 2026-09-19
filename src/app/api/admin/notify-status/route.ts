import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";

/**
 * GET /api/admin/notify-status — diagnostic for the Notify tab.
 * Returns:
 *  - appIdConfigured: whether ONESIGNAL_APP_ID / NEXT_PUBLIC_ONESIGNAL_APP_ID exist
 *  - appIdsMatch: the two must be IDENTICAL or browser subs land in another app
 *  - subscriptions / messageableSubscriptions from `GET /apps/{app_id}`
 *  - webPushConfigured / pushChannelEnabled: the two dashboard settings that make
 *    `OneSignal.init()` succeed in the browser. When webPushConfigured is false
 *    the SDK throws "App not configured for web push", no subscription can ever
 *    be created, and every send answers "All included players are not subscribed".
 * Auth: x-admin-password header, like every other /api/admin/* route.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverAppId = process.env.ONESIGNAL_APP_ID ?? "";
  const clientAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "";
  const apiKey = process.env.ONESIGNAL_API_KEY ?? "";

  if (!serverAppId || !apiKey) {
    return NextResponse.json(
      {
        appIdConfigured: false,
        error: "Missing ONESIGNAL_APP_ID / ONESIGNAL_API_KEY env vars on the server",
      },
      { status: 500 }
    );
  }

  /** OneSignal answers some endpoints with plain text (e.g. a 404 page). */
  async function safeJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return { rawResponse: text.slice(0, 300) } as T;
    }
  }

  /** Only the fields this diagnostic reads. */
  type AppResponse = {
    players?: number;
    messageable_players?: number;
    chrome_web_origin?: string | null;
    channels?: { push?: { enabled?: boolean } };
    rawResponse?: string;
  };
  type PlayersResponse = {
    total_count?: number;
    players?: Array<{
      id?: string;
      notification_types?: number;
      invalid_identifier?: boolean;
      device_type?: number;
      last_active?: number;
    }>;
    rawResponse?: string;
  };

  try {
    const headers = { Authorization: `Basic ${apiKey}` };

    // 1) App object — the documented source of truth for the subscription
    // count and for whether the web platform can create subscriptions at all.
    const appRes = await fetch(`https://api.onesignal.com/apps/${serverAppId}`, {
      headers,
    });
    const app = await safeJson<AppResponse>(appRes);
    if (!appRes.ok) {
      return NextResponse.json(
        { appIdConfigured: true, error: `OneSignal app API: ${JSON.stringify(app)}` },
        { status: 500 }
      );
    }

    const subscriptions: number = app.players ?? 0;
    const messageableSubscriptions: number = app.messageable_players ?? 0;
    const webPushConfigured = Boolean(app.chrome_web_origin);
    const pushChannelEnabled = Boolean(app.channels?.push?.enabled);

    // 2) Legacy /players list — DEPRECATED and empty for v16 Web SDK
    // subscriptions. Kept only as an extra signal; a non-JSON/failed response
    // must never break the whole diagnostic (it used to surface as a raw
    // "Unexpected non-whitespace character after JSON" SyntaxError).
    let legacyTotalCount = 0;
    let legacyOptedIn = 0;
    let validTokens = 0;
    let sample: unknown[] = [];
    let legacyError: string | undefined;

    try {
      const playersRes = await fetch(
        `https://api.onesignal.com/players?app_id=${serverAppId}&limit=300&offset=0`,
        { headers }
      );
      const playersData = await safeJson<PlayersResponse>(playersRes);
      if (!playersRes.ok) {
        legacyError = `OneSignal players API: HTTP ${playersRes.status}`;
      } else {
        const players = Array.isArray(playersData.players) ? playersData.players : [];

        legacyTotalCount = playersData.total_count ?? players.length;
        legacyOptedIn = players.filter((p) => p.notification_types === 1).length;
        validTokens = players.filter((p) => p.invalid_identifier !== true).length;
        sample = players.slice(0, 10).map((p) => ({
          idPrefix: (p.id ?? "?").slice(0, 8),
          notification_types: p.notification_types,
          invalid_identifier: p.invalid_identifier,
          device_type: p.device_type,
          last_active: p.last_active,
        }));
      }
    } catch (e) {
      legacyError = String(e).slice(0, 300);
    }

    return NextResponse.json({
      appIdConfigured: true,
      appIdsMatch: clientAppId !== "" && clientAppId === serverAppId,
      // Never leak the full IDs — just prefixes for visual comparison.
      serverAppIdPrefix: serverAppId.slice(0, 8),
      clientAppIdPrefix: clientAppId ? clientAppId.slice(0, 8) : "(missing)",
      // Authoritative counts from the app object.
      totalCount: subscriptions,
      subscriptions,
      messageableSubscriptions,
      webPushConfigured,
      webPushOrigin: app.chrome_web_origin ?? null,
      pushChannelEnabled,
      legacyTotalCount,
      legacyOptedIn,
      validTokens,
      legacyError,
      note: webPushConfigured
        ? "Send uses `filters: session_count exists` — one send targets every known subscription."
        : "The OneSignal app has no Web platform / Site URL configured, so no browser can subscribe and every send will answer \"All included players are not subscribed\". Add the Site URL in the OneSignal dashboard (Settings → Push & In-App → Web).",
      sample,
    });
  } catch (error) {
    return NextResponse.json(
      { appIdConfigured: true, error: String(error) },
      { status: 500 }
    );
  }
}
