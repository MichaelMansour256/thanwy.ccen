/**
 * Site configuration — shared identity used across the whole site
 * (metadata, PWA manifest, hero, contact page, push notifications).
 * Meeting-specific content (name, schedule, about text) lives in `meeting.ts`.
 */
export interface SocialLink {
  /** Network name — also used to pick the icon (see `SocialLinks.tsx`). */
  name: string;
  url: string;
}

/** Fallback used when NEXT_PUBLIC_SITE_URL is unset, empty or malformed. */
const DEFAULT_SITE_URL = "https://thanwy-ccen.vercel.app";

/**
 * Resolve the public site URL from the environment.
 *
 * `??` is not enough here: a NEXT_PUBLIC_* variable that exists but holds an
 * empty value (easy to leave behind in the Vercel UI) is inlined as "" at build
 * time, and `new URL("")` throws while Next.js collects route data, failing the
 * whole build with ERR_INVALID_URL. So an unset, empty and whitespace-only value
 * all fall back to the default. A value without a scheme ("thanwy.ccen") is
 * normalised too, and trailing slashes are stripped so it can be joined with
 * paths (`${url}/sitemap.xml`).
 */
function resolveSiteUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/\/+$/, "");
  if (!value) return DEFAULT_SITE_URL;

  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      .toString()
      .replace(/\/+$/, "");
  } catch {
    console.warn(
      `[site] Ignoring invalid NEXT_PUBLIC_SITE_URL: ${JSON.stringify(raw)}`
    );
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  /** Full site/meeting title (browser tabs, PWA manifest name). */
  name: "Thanwy Youth Meeting",
  /** Short name (installed-app title, admin pages). */
  shortName: "Thanwy",
  /** Site description (SEO metadata + PWA manifest). */
  description: {
    en: "Thanwy Youth Meeting – Christ Church Ezbet El Nakhl",
    ar: "اجتماع شباب ثانوي · كنيسة المسيح – عزبة النخل",
  },
  /**
   * Public site URL — base for push-notification click-through links, canonical
   * metadata, robots.txt and the sitemap. Override with NEXT_PUBLIC_SITE_URL
   * (set it in production so notification links always point at the deployed
   * site, not the local dev server). Unset, empty or scheme-less values are
   * normalised — see `resolveSiteUrl`.
   */
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),

  /** The church this meeting belongs to. */
  church: {
    name: "Christ Church – Ezbet El Nakhl",
    nameAr: "كنيسة المسيح – عزبة النخل",
  },

  /**
   * Contact details. The current site does not display an email or phone
   * anywhere; fill these in if a future design renders them.
   */
  contact: {
    email: "",
    phone: "",
  },

  /** Social links (rendered on the home hero and the contact page). */
  social: [
    { name: "Facebook", url: "https://www.facebook.com/shababe.thanwy" },
    { name: "Instagram", url: "https://www.instagram.com/thanwy.meeting.ccen/" },
  ] satisfies SocialLink[],

  /** Branding assets under /public — replace these files for a new meeting. */
  assets: {
    /** Round logo shown on the home hero and about page. */
    logo: "/thanwy-logo.png",
    /** App/PWA icon (also used as notification icon). */
    appIcon: "/app-icon.png",
  },

  /**
   * Cloudinary namespace that stores this meeting's app data:
   * `<meetingFolder>/events` (special-events JSON) and
   * `<meetingFolder>/verse_of_week` (verse JSON). Gallery event folders and
   * the `invitations` folder live outside it in the same cloud account.
   * Override with CLOUDINARY_MEETING_FOLDER so each meeting keeps its own
   * namespace and never reads or writes another meeting's data (a blank value
   * falls back to the default below).
   */
  cloudinary: {
    meetingFolder: process.env.CLOUDINARY_MEETING_FOLDER?.trim() || "thanwy_events",
  },
};

export type SiteConfig = typeof siteConfig;
