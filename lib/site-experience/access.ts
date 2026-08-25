import type { AdminPermission } from "@/lib/admin/rbac";
import type { SiteExperienceResource } from "@/lib/site-experience/config";

export const siteExperienceAccess: Record<SiteExperienceResource, { read: AdminPermission; update: AdminPermission; publish: AdminPermission }> = {
  settings: { read: "settings.read", update: "settings.manage", publish: "settings.manage" },
  identity: { read: "appearance.read", update: "appearance.update", publish: "appearance.update" },
  appearance: { read: "appearance.read", update: "appearance.update", publish: "appearance.update" },
  homepage: { read: "homepage.read", update: "homepage.update", publish: "homepage.publish" },
  navigation: { read: "navigation.read", update: "navigation.update", publish: "navigation.update" },
  footer: { read: "footer.read", update: "footer.update", publish: "footer.update" },
  seo: { read: "seo.read", update: "seo.update", publish: "seo.update" },
  profile_presentation: { read: "profile_presentation.read", update: "profile_presentation.update", publish: "profile_presentation.update" },
};
