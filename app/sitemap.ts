import type { MetadataRoute } from "next";
import { personService } from "@/lib/services/personService";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/categories", "/about", "/contact", "/privacy"].map((pathname) => ({
    url: absoluteUrl(pathname),
  }));

  try {
    const [categories, people] = await Promise.all([
      personService.listCategories(),
      personService.listPublishedPeople(),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categories/${category.slug}`),
      })),
      ...people.map((person) => ({
        url: absoluteUrl(`/person/${person.slug}`),
        lastModified: new Date(person.updatedAt),
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
