/**
 * Servants directory.
 * Photos live in `public/servants images/` — drop a new photo there and add
 * an entry below (paths are served from the site root, keep the folder name
 * as-is or update `SERVANTS_DIR` if you rename it).
 *
 * ⚠️ TODO(Thanwy): add this meeting's servants below — each `file` must match
 * a photo file placed in `public/servants images/`. Until then the servants
 * page renders an empty state (see `src/app/[locale]/more/servants/page.tsx`).
 * Do NOT copy another meeting's servants from another deployment.
 */
export interface Servant {
  /** Photo file name inside the servants images folder. */
  file: string;
  /** Name (English). */
  name: string;
  /** Name (Arabic) — the one displayed on the cards. */
  nameAr: string;
  /** Optional role within the meeting. */
  role?: string;
}

/** Public URL prefix for servant photos (folder name contains a space). */
export const SERVANTS_DIR = "/servants images";

/** Servants page title (kept Arabic, matching the current UI). */
export const servantsTitleAr = "الخدام";

/** Servants of this meeting — empty until this meeting's data is added. */
export const servants: Servant[] = [];
