import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo/site";
import { siteExperienceDefaults } from "@/lib/site-experience/config";
import { siteExperienceRepository } from "@/lib/site-experience/repository";
import { withTimeout } from "@/lib/foundation/withTimeout";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await withTimeout(siteExperienceRepository.getPublishedResource("seo"), 2500).catch(() => siteExperienceDefaults.seo);
  return { rules: { userAgent: "*", allow: seo.indexingAllowed ? "/" : undefined, disallow: seo.indexingAllowed ? ["/api/", "/admin/", "/account/"] : "/" }, sitemap: absoluteUrl("/sitemap.xml"), host: siteUrl.toString() };
}
