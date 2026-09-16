# 📖 Template Guide — Building a Church Meeting Website From This Repo

This repository is a **reusable template for church meeting websites**. The code
defines *how the website works*; the configuration under `src/config/` defines
*which meeting the website represents*.

The Thanwy Youth Meeting site (this repository) is a **live instance** of the
template — all default config values are its live values. Creating a new
meeting website means changing configuration + assets, not rewriting
components.

---

## Architecture Overview

```text
                 CHURCH MEETING WEBSITE
                         │
             ┌───────────┴───────────┐
             │                       │
       SHARED CORE              MEETING CONFIG
             │                       │
       Pages & routes          src/config/*
       Components              messages/{ar,en}.json
       Feature logic           public/ branding assets
       Admin dashboard         .env  (Supabase/Cloudinary/OneSignal)
       Integrations
      (Supabase/Cloudinary/
       OneSignal/crons)
             │                       │
             └───────────┬───────────┘
                         │
                  YOUR MEETING WEBSITE
```

### Which file controls what

| File | Purpose |
|---|---|
| `src/config/site.ts` | Website & branding identity: site name, church name, description, social links, contact, public URL, logo/app-icon paths, Cloudinary meeting folder |
| `src/config/theme.ts` | Visual identity: all brand colors + background-gradient stops (single source of truth for every color on the site) |
| `src/config/meeting.ts` | Meeting-specific info: name (ar/en), age group, weekly schedule, hero texts, tagline, About page content (paragraphs + pillars), location |
| `src/config/servants.ts` | Servants directory (names + photos) |
| `src/config/navigation.ts` | Bottom nav tabs, home quick links, More-page items, Bible-page sections |
| `src/config/features.ts` | Feature flags for major optional sections (events, bible, games, gallery, prayer wall, servants, about, contact, notifications) |
| `src/config/index.ts` | Barrel — everything is imported from `@/config` |
| `messages/ar.json`, `messages/en.json` | Generic UI labels (nav items, section titles) in both languages |
| `public/` | Meeting-specific assets: `thanwy-logo.png`, `app-icon.png`, `appstore-images/` (PWA icons + splash), `servants images/` |
| `src/app/manifest.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` | PWA manifest + SEO files, generated from the config above |
| `.env.local` | Environment-specific: Supabase, Cloudinary, OneSignal, admin password, cron secret (see `.env.example`) |

---

## How Theming Works (no component edits needed)

- `src/app/globals.css` declares CSS custom properties (`--blue-dark`,
  `--blue-primary`, `--blue-mid`, `--blue-accent`, `--blue-light`,
  `--gradient-*`) and maps them to Tailwind tokens via `@theme inline`
  (utilities like `bg-blue-primary/40`, `text-blue-light/60` keep working).
- Both root layouts inject the values from `themeConfig` as an inline
  `<style>` tag (`themeCssVars()`), so **`src/config/theme.ts` is the live
  source of truth**. The `:root` values in `globals.css` are SSR fallbacks —
  keep them in sync to avoid a first-paint flash of old colors.
- The token *names* (`blue-*`) are legacy — they don't have to be blue. A
  gold/red/green meeting only changes the values in `theme.ts`, plus
  the PWA theme colors which come from the same config (metadata, manifest).

> ⚠️ Editor hint: VS Code's built-in CSS linter flags `@theme` as an unknown
> at-rule ("Unknown at rule @theme"). That's cosmetic — Tailwind v4 processes
> it at build time. Silence with `"css.lint.unknownAtRules": "ignore"` or the
> *Tailwind CSS IntelliSense* extension.

---

## Creating a New Meeting Website — Step by Step

### 1. Clone / use the repo as a template

```bash
git clone <this-repo> my-meeting.ccen
cd my-meeting.ccen
npm install
```

### 2. Update `src/config/site.ts`

Set the site/meeting identity: `name`, `shortName`, `description` (ar/en),
`church` (name + Arabic name), `social` links, `url` (your deployed URL),
`assets` paths if you rename files.

### 3. Update `src/config/theme.ts`

Set `colors.dark/primary/mid/accent/light` and the `gradient` stops to your
meeting's brand palette. Mirror the same hex values into the `:root` fallbacks
in `src/app/globals.css`.

### 4. Update `src/config/meeting.ts`

- `name` / `nameEn` / `shortName` / `ageGroup` / `tagline`
- `hero.welcome` + `hero.subtitle` (ar/en) — home page headline
- `schedule` — `weekday` (0=Sun…6=Sat), `time` ("HH:MM" 24h), display labels
  (`labelAr/labelEn`), and reminder building blocks (`dayNameAr/En`,
  `timeLabelAr/En`) used by push notifications
- `location`, `about.title`, `about.paragraphs`, `about.pillars`

### 5. Update `src/config/servants.ts`

Replace the servants array (name + Arabic name) and drop the photos into
`public/servants images/` (or rename the folder and update `SERVANTS_DIR`).
Until entries exist the servants page renders a bilingual "coming soon" empty
state, so the section can ship before the data does.

### 6. Update navigation & features (optional)

- `src/config/navigation.ts` — reorder/remove items; `key`s map to
  `messages/{locale}.json` namespaces (`nav`, `more`, `bible`).
- `src/config/features.ts` — set any major section to `false` and it
  disappears from navigation (page code stays in place).

### 7. Replace branding assets

| Asset | Used for |
|---|---|
| `public/thanwy-logo.png` | Home hero + About page logo (referenced by `siteConfig.assets.logo`) |
| `public/app-icon.png` | PWA icon, favicon, notification icon (512×512, referenced by `siteConfig.assets.appIcon`) |
| `public/appstore-images/**` | Platform icons, Windows tiles/splashes and iOS startup images (filenames + sizes must stay as-is) |
| `public/appstore-images/ios/splash-<W>x<H>.png` | iPhone startup images — the exact sizes are linked from `src/app/[locale]/layout.tsx` |
| `public/servants images/` | Servants photos |
| `public/OneSignalSDKWorker.js`, `OneSignalSDKUpdaterWorker.js` | OneSignal service workers — keep as-is |

Brand colors are **not** assets: replace the values in `src/config/theme.ts`
(+ the `:root` fallbacks in `src/app/globals.css`) and the PWA/theme colors
follow automatically.

Update `messages/ar.json` / `messages/en.json` for generic UI labels
(`nav`, `events`, `bible`, `games`, `more` namespaces). Meeting identity text
does **not** live here anymore — it's in `src/config/meeting.ts`.

### 8. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in **your own** Supabase project, Cloudinary account, OneSignal app,
admin password and cron secret (never commit real secrets). Set
`NEXT_PUBLIC_SITE_URL` to your deployed URL so push-notification links work.

### 9. Configure Supabase / Cloudinary / OneSignal

**Supabase** (one project per meeting — the schema is single-meeting):

```sql
-- Prayer wall
create table prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  request text not null,
  pray_count int not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
-- Notification history: see supabase-notifications-history.sql in the repo root.
```

Enable RLS; only the public API routes (anon key, `status = approved` rows)
and admin routes touch these tables.

**Cloudinary**: the app stores its data JSON under
`siteConfig.cloudinary.meetingFolder` (`events`, `verse_of_week`) and reads
gallery photos from any root folder except `invitations` and the meeting
folder. Admin uploads photos into event folders it creates. For a shared
cloud account, set `CLOUDINARY_MEETING_FOLDER` to a unique namespace for the
new meeting so the other meeting's data stays untouched.

**OneSignal**: create a new web-push app, set its ID + REST API key in env,
keep the two `OneSignalSDKWorker*.js` files in `public/` (v16 stubs at root
scope). Nothing else in the notification stack is meeting-specific.

**Vercel crons** (`vercel.json`): review the schedules — they assume a
Thursday-evening invitation reminder (`0 17 * * 4`) and a Sunday-morning
verse notification (`0 7 * * 0`). Adjust to your meeting rhythm. The
invitation reminder uses the invitation image uploaded via the admin
dashboard for the next meeting date, falling back to a text invitation.

### 10. Run locally

```bash
npm run dev     # http://localhost:3000
```

### 11. Deploy to Vercel

- Push to a new repo / import into Vercel.
- Add all env vars in **Project Settings → Environment Variables**.
- Deploy — crons come from `vercel.json`.

---

## What Is Meeting-Specific vs. Shared

| Area | Shared (code) | Meeting-specific (config/assets/env) |
|---|---|---|
| Pages, layouts, components | ✅ | — |
| Navigation structure | ✅ | labels via `messages/`, structure via `navigation.ts` |
| Theme colors | ✅ mechanism | `theme.ts` values + `globals.css` fallbacks |
| Hero / About text | ✅ rendering | `meeting.ts` |
| Servants | ✅ card grid | `servants.ts` + photos |
| Schedule / countdown | ✅ logic (`lib/schedule.ts`) | `meeting.ts` → `schedule` |
| Push notifications | ✅ logic | OneSignal env (app id / key) |
| Prayer wall / notif history | ✅ logic | Supabase env (URL / anon key) |
| Gallery / invitations / events | ✅ logic | Cloudinary env + folder namespace |
| Admin dashboard | ✅ | `ADMIN_PASSWORD` env |
| Bible verse of the week | ✅ (GetBible API) | admin-selected weekly verse data |

## Instance-Specific Values (set to Thanwy's)

Everything below is *configuration*, not code — copy the repo and change these
to brand the new meeting:

- `package.json` name `thanwy.ccen` (project identifier).
- `siteConfig.cloudinary.meetingFolder` default `"thanwy_events"` and the
  default `siteConfig.url` (`https://thanwy.ccen`) — override via
  `CLOUDINARY_MEETING_FOLDER` / `NEXT_PUBLIC_SITE_URL`. **Never** point a new
  meeting at another meeting's folder namespace.
- `public/` branding assets (`thanwy-logo.png`, `app-icon.png`,
  `appstore-images/**`, servants photos).
- `siteConfig.social` links and `meetingConfig.schedule` — verify the meeting
  day/time before launch (`meeting.ts` carries a TODO note).
- The **Verse Up Arena** game embed (`src/app/[locale]/games/page.tsx` →
  `verse-up-arena.vercel.app`) is an external product tied to this ecosystem —
  change the URL/logo in the games page for a different game platform.
- Supabase data itself (prayer requests / notification history) — use a fresh
  project per meeting so moderation queues stay separate.
- Repository URL references in the README (deployment history).

## Known TODOs For This Meeting

- `src/config/meeting.ts` → confirm the weekly `schedule` (weekday + time) and
  the reminder labels.
- `src/config/servants.ts` → add the meeting's servants + photos (the array is
  intentionally empty; the page shows a bilingual empty state until then).
- `.env.local` → Supabase / Cloudinary / OneSignal / admin password / cron
  secret / `NEXT_PUBLIC_SITE_URL`.

