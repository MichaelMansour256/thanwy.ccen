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

export const siteConfig = {
  /** Full site/meeting title (browser tabs, PWA manifest name). */
  name: "Thanwy Youth Meeting",
  /** Short name (installed-app title, admin pages). */
  shortName: "Thanwy",
  /** Site description (SEO metadata + PWA manifest). */
  description: {
    en: "Thanwy Youth Meeting – Christ Church",
    ar: "اجتماع شباب ثانوي · كنيسة المسيح",
  },
  /**
   * Public site URL — base for push-notification click-through links.
   * Override with NEXT_PUBLIC_SITE_URL (set it in production so notification
   * links always point at the deployed site, not the local dev server).
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thanwy.ccen",

  /** The church this meeting belongs to. */
  church: {
    name: "Christ Church",
    nameAr: "كنيسة المسيح",
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
    { name: "Facebook", url: "https://www.facebook.com/thanwy.ccen" },
    { name: "Instagram", url: "https://www.instagram.com/thanwy.ccen" },
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
   * namespace and never reads or writes another meeting's data.
   */
  cloudinary: {
    meetingFolder: process.env.CLOUDINARY_MEETING_FOLDER ?? "thanwy_events",
  },
};

export type SiteConfig = typeof siteConfig;
