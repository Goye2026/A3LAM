import type { MetadataRoute } from "next";
import { personService } from "@/lib/services/personService";
import { listPublicProfiles } from "@/lib/user/profileRepository";
import { absoluteUrl } from "@/lib/seo/site";
import { editorialRepository } from "@/lib/cms/editorialRepository";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/categories", "/about", "/contact", "/privacy"].map((pathname) => ({
    url: absoluteUrl(pathname),
  }));

  try {
    const [categories, people, profiles] = await Promise.all([
      personService.listCategories(),
      personService.listPublishedPeople(),
      listPublicProfiles(),
    ]);

    let cmsRoutes: MetadataRoute.Sitemap = [];
    try {
      const [pages, posts] = await Promise.all([
        editorialRepository.listPublishedForSitemap("page"),
        editorialRepository.listPublishedForSitemap("post"),
      ]);
      cmsRoutes = [
        ...pages.map((page) => ({ url: absoluteUrl(`/page/${page.slug}`), lastModified: page.updatedAt })),
        ...posts.map((post) => ({ url: absoluteUrl(`/article/${post.slug}`), lastModified: post.updatedAt })),
      ];
    } catch {
      cmsRoutes = [];
    }

    return [
      ...staticRoutes,
      ...cmsRoutes,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categories/${category.slug}`),
      })),
      ...people.map((person) => ({
        url: absoluteUrl(`/person/${person.slug}`),
        lastModified: new Date(person.updatedAt),
      })),
      ...profiles.map((profile) => ({
        url: absoluteUrl(`/person/${profile.slug}`),
        lastModified: new Date(profile.updatedAt),
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
