import type { Metadata } from "next";

const fallbackSiteUrl = "http://localhost:3000";

function resolveSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredSiteUrl) return new URL(fallbackSiteUrl);

  try {
    return new URL(configuredSiteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const siteUrl = resolveSiteUrl();

export function absoluteUrl(pathname: string) {
  return new URL(pathname, siteUrl).toString();
}

export function pageMetadata(title: string, description: string, pathname: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      type: "website",
      title,
      description,
      url: pathname,
    },
  };
}
