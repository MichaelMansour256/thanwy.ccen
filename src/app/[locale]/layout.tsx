import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import BottomNav from "@/components/BottomNav";
import OneSignalInit from "@/components/OneSignalInit";
import { siteConfig, themeConfig, themeCssVars } from "@/config";
import { Cairo, Inter } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-inter", display: "swap" });

/** Locale-aware title/description + canonical/hreflang pairs. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const description = isAr ? siteConfig.description.ar : siteConfig.description.en;

  return {
    title: siteConfig.name,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: siteConfig.name,
      description,
      url: `/${locale}`,
      locale: isAr ? "ar_EG" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "ar")) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}
      className={locale === "ar" ? cairo.variable : inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content={themeConfig.colors.dark} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.shortName} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href={siteConfig.assets.appIcon} />
        <link rel="apple-touch-icon" sizes="167x167" href={siteConfig.assets.appIcon} />
        <link rel="apple-touch-icon" sizes="152x152" href={siteConfig.assets.appIcon} />
        <link rel="apple-touch-icon" sizes="120x120" href={siteConfig.assets.appIcon} />
        {/* Apple splash screens — portrait images sized to each device's
            CSS viewport × device-pixel-ratio (see public/appstore-images/ios). */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/ios/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/ios/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/ios/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/ios/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/appstore-images/ios/splash-750x1334.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/appstore-images/ios/splash-828x1792.png" />
      </head>
      <body>
        {/* Live theme values from src/config/theme.ts (overrides the
            globals.css fallbacks — placed first in <body> so it wins the
            cascade against the stylesheet in <head>). */}
        <style dangerouslySetInnerHTML={{ __html: themeCssVars() }} />
        {/* OneSignal Web SDK v16 - next/script in component, init only after SDK loads */}
        <OneSignalInit />
        <NextIntlClientProvider messages={messages}>
          <main className="pb-safe min-h-dvh">{children}</main>
          <BottomNav locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
