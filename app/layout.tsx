import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/seo/site";
import { siteExperienceDefaults } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";
import { withTimeout } from "@/lib/foundation/withTimeout";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await withTimeout(siteExperienceRepository.getPublishedResource("seo"), 2500).catch(() => siteExperienceDefaults.seo);
  const identity = await withTimeout(siteExperienceRepository.getPublishedResource("identity"), 2500).catch(() => siteExperienceDefaults.identity);
  return {
    metadataBase: siteUrl,
    title: { default: seo.siteTitle || identity.siteName, template: `%s | ${identity.siteName || "أعلام"}` },
    description: seo.defaultDescription,
    applicationName: identity.siteName,
    icons: { icon: identity.faviconUrl || "/icon.svg", apple: identity.faviconUrl || "/icon.svg" },
    keywords: seo.defaultKeywords,
    openGraph: { type: "website", locale: "ar_AR", siteName: identity.siteName, title: seo.siteTitle, description: seo.defaultDescription, ...(seo.defaultOgImage ? { images: [seo.defaultOgImage] } : {}) },
    twitter: { card: seo.twitterCard, title: seo.siteTitle, description: seo.defaultDescription, ...(seo.defaultOgImage ? { images: [seo.defaultOgImage] } : {}) },
    robots: seo.indexingAllowed ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appearance = await withTimeout(siteExperienceRepository.getPublishedResource("appearance"), 2500).catch(() => siteExperienceDefaults.appearance);
  const settings = await withTimeout(siteExperienceRepository.getPublishedResource("settings"), 2500).catch(() => siteExperienceDefaults.settings);
  return (
    <html lang={settings.defaultLanguage} dir={settings.defaultDirection}>
      <body data-theme={appearance.theme} data-density={appearance.tokens.density} data-radius={appearance.radius} data-container={appearance.tokens.container} data-card-style={appearance.cardStyle}>{children}</body>
    </html>
  );
}
