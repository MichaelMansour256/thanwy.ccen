import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig, features, type FeatureKey } from "@/config";

/**
 * Public, indexable pages (admin and API routes are deliberately excluded).
 * Every entry is generated for each locale, with hreflang alternates.
 */
const pages: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  feature?: FeatureKey;
}[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/events", priority: 0.9, changeFrequency: "weekly", feature: "events" },
  { path: "/bible", priority: 0.8, changeFrequency: "weekly", feature: "bible" },
  { path: "/bible/verse", priority: 0.8, changeFrequency: "weekly", feature: "bible" },
  { path: "/bible/studies", priority: 0.6, changeFrequency: "monthly", feature: "bible" },
  { path: "/bible/resources", priority: 0.6, changeFrequency: "monthly", feature: "bible" },
  { path: "/games", priority: 0.6, changeFrequency: "monthly", feature: "games" },
  { path: "/more", priority: 0.7, changeFrequency: "monthly" },
  { path: "/more/about", priority: 0.7, changeFrequency: "monthly", feature: "about" },
  { path: "/more/gallery", priority: 0.7, changeFrequency: "weekly", feature: "gallery" },
  { path: "/more/servants", priority: 0.5, changeFrequency: "monthly", feature: "servants" },
  { path: "/more/prayer-wall", priority: 0.6, changeFrequency: "weekly", feature: "prayerWall" },
  { path: "/more/contact", priority: 0.5, changeFrequency: "monthly", feature: "contact" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${baseUrl}/${locale}`])
  );

  return pages
    .filter((page) => page.feature === undefined || features[page.feature])
    .flatMap((page) =>
      routing.locales.map((locale) => ({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(languages).map(([code, url]) => [code, `${url}${page.path}`])
          ),
        },
      }))
    );
}