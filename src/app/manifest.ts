import type { MetadataRoute } from "next";
import { siteConfig, themeConfig } from "@/config";

/**
 * Dynamic PWA manifest generated from the site/theme configuration.
 * (Replaces the former static `public/manifest.json` so a new meeting only
 * edits the config.) Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description.ar,
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: themeConfig.colors.dark,
    theme_color: themeConfig.colors.dark,
    orientation: "portrait",
    categories: ["lifestyle", "education"],
    icons: [
      // One square asset (siteConfig.assets.appIcon) covers every size the
      // installers ask for; it is declared once as `any` (normal use) and once
      // as `maskable` (Android adaptive icons, which crop to the safe zone —
      // the artwork keeps its wordmark inside the middle 80%).
      {
        src: siteConfig.assets.appIcon,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: siteConfig.assets.appIcon,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: siteConfig.assets.appIcon,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}