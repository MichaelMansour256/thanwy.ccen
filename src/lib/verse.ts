import cloudinary from "./cloudinary";
import { siteConfig } from "@/config";

export type VerseRef = {
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  note?: string; // optional servant note
};

// Stored as a raw JSON resource under the meeting's Cloudinary namespace
// (`siteConfig.cloudinary.meetingFolder`, default "thanwy_events").
const PUBLIC_ID = `${siteConfig.cloudinary.meetingFolder}/verse_of_week`;

export async function getVerseRef(): Promise<VerseRef | null> {
  try {
    const result = await cloudinary.api.resource(PUBLIC_ID, { resource_type: "raw" });
    const res = await fetch(result.secure_url + `?t=${Date.now()}`);
    return await res.json();
  } catch (error) {
    // Returning null means "no verse configured", which is what callers act
    // on — but a Cloudinary/network failure also lands here. Without this log
    // a transient outage made /api/cron/verse-notification answer
    // {"skipped":"No verse set"} with HTTP 200, i.e. a silently skipped
    // weekly notification that looked like a healthy cron run.
    console.error("getVerseRef failed (treating as \"no verse set\"):", error);
    return null;
  }
}

export async function saveVerseRef(ref: VerseRef): Promise<void> {
  const buffer = Buffer.from(JSON.stringify(ref));
  await new Promise<void>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: PUBLIC_ID, resource_type: "raw", overwrite: true },
        (err) => (err ? reject(err) : resolve())
      )
      .end(buffer);
  });
}
