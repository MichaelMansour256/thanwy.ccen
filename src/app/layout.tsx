import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig, themeConfig } from "@/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.description.en,
  applicationName: siteConfig.shortName,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: siteConfig.assets.appIcon,
    apple: siteConfig.assets.appIcon,
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description.en,
    url: "/",
    images: [
      {
        url: siteConfig.assets.appIcon,
        width: 512,
        height: 512,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description.en,
    images: [siteConfig.assets.appIcon],
  },
};

export const viewport: Viewport = {
  themeColor: themeConfig.colors.dark,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
