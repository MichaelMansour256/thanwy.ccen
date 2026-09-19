// Notification history storage using Supabase
// Replaces the previous file-based storage (public/notifications-history.json)
// which doesn't work on Vercel/serverless (read-only filesystem)

import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface NotificationRecord {
  id: string;
  sentAt: string;
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url: string;
  image: string | null;
  onesignalId: string | null;
  status: "sent" | "failed_no_subscribers" | "failed_error" | string;
  recipients: number | null;
  createdAt: string;
  error?: string;
}

/**
 * Save a notification record to Supabase.
 */
export async function putNotificationRecord(
  record: Omit<NotificationRecord, "createdAt">
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error("Supabase is not configured — notification record not saved.");
    return;
  }

  const { error } = await getSupabase()
    .from("notifications_history")
    .insert({
      id: record.id,
      sent_at: record.sentAt,
      heading_ar: record.headingAr,
      heading_en: record.headingEn,
      message_ar: record.messageAr,
      message_en: record.messageEn,
      url: record.url,
      image: record.image,
      onesignal_id: record.onesignalId,
      status: record.status,
      recipients: record.recipients,
      error: record.error ?? null,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error(
      "Failed to save notification record to Supabase:",
      error
    );
    throw error;
  }
}

/**
 * Get all notification records, newest first.
 *
 * Returns the failure reason instead of only an empty array: an empty
 * `records` list is otherwise indistinguishable from "the table is missing /
 * RLS denied the read / the network failed", and the admin UI would show an
 * empty history (or silently fall back to a different data source) with no
 * hint that something is broken.
 */
export interface NotificationHistoryResult {
  records: NotificationRecord[];
  error?: string;
}

export async function getNotificationHistory(): Promise<NotificationHistoryResult> {
  if (!isSupabaseConfigured()) {
    const message =
      "Supabase is not configured — notification history is unavailable.";
    console.error(message);
    return { records: [], error: message };
  }

  const { data, error } = await getSupabase()
    .from("notifications_history")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch notification history from Supabase:", error);
    // 42P01 = table does not exist, 42501 = RLS denied. Both used to look
    // like "no notifications sent yet".
    return {
      records: [],
      error: `${error.code ? `[${error.code}] ` : ""}${error.message}`,
    };
  }

  // Row shape of notifications_history (snake_case columns).
  type NotificationRow = {
    id: string;
    sent_at: string;
    heading_ar: string;
    heading_en: string;
    message_ar: string;
    message_en: string;
    url: string;
    image: string | null;
    onesignal_id: string | null;
    status: string;
    recipients: number | null;
    created_at: string;
    error: string | null;
  };

  return {
    records: (data || []).map((row: NotificationRow) => ({
      id: row.id,
      sentAt: row.sent_at,
      headingAr: row.heading_ar,
      headingEn: row.heading_en,
      messageAr: row.message_ar,
      messageEn: row.message_en,
      url: row.url,
      image: row.image,
      onesignalId: row.onesignal_id,
      status: row.status,
      recipients: row.recipients,
      createdAt: row.created_at,
      error: row.error ?? undefined,
    })),
  };
}

/**
 * Get a single notification record by ID.
 */
export async function getNotificationById(
  id: string
): Promise<NotificationRecord | null> {
  if (!isSupabaseConfigured()) {
    console.error("Supabase is not configured — notification lookup skipped.");
    return null;
  }

  const { data, error } = await getSupabase()
    .from("notifications_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch notification record from Supabase:", { code: error.code, message: error.message });
    return null;
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    sentAt: data.sent_at,
    headingAr: data.heading_ar,
    headingEn: data.heading_en,
    messageAr: data.message_ar,
    messageEn: data.message_en,
    url: data.url,
    image: data.image,
    onesignalId: data.onesignal_id,
    status: data.status,
    recipients: data.recipients,
    createdAt: data.created_at,
    error: data.error,
  };
}

