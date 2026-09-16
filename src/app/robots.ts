import type { MetadataRoute } from "next";
import { siteConfig } from "@/config";

/** Allow crawlers on the public site, keep the admin dashboard and API out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}