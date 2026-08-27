import type { AdminPermission } from "@/lib/admin/rbac";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsAdminNavGroup, CmsAdminNavItem } from "./types";

type AdminCopy = Pick<
  FoundationMessages,
  | "adminDashboard"
  | "adminPeople"
  | "adminAddPerson"
  | "adminCategories"
  | "adminReviewContent"
  | "adminContent"
  | "adminMedia"
  | "adminAppearance"
  | "adminSiteExperienceCenter"
  | "adminIdentitySettings"
  | "adminNavigationManager"
  | "adminFooterManager"
  | "adminUsers"
  | "adminAdministrators"
  | "adminEditors"
  | "adminSessions"
  | "adminPermissionMatrix"
  | "adminPermissionOverrides"
  | "adminSettings"
  | "adminSeo"
  | "adminAudit"
  | "adminLaunchControl"
  | "adminSystem"
  | "adminAi"
  | "adminPeopleGroup"
  | "adminOperationsGroup"
  | "adminProductGroup"
  | "adminSystemGroup"
  | "adminCmsPages"
  | "adminCmsPosts"
  | "adminCmsTags"
  | "adminCmsWidgets"
  | "adminCmsUnavailable"
>;

const item = (
  id: string,
  label: string,
  href: string | null,
  permission: AdminPermission | null,
  availability: CmsAdminNavItem["availability"] = "available",
): CmsAdminNavItem => ({ id, label, href, permission, availability });

export function getAdminNavigation(copy: AdminCopy): readonly CmsAdminNavGroup[] {
  return [
    {
      id: "dashboard",
      label: copy.adminDashboard,
      items: [item("dashboard", copy.adminDashboard, "/admin", null)],
    },
    {
      id: "content",
      label: copy.adminContent,
      items: [
        item("people", copy.adminPeople, "/admin/people", "people.read"),
        item("person-new", copy.adminAddPerson, "/admin/people/new", "people.create"),
        item("categories", copy.adminCategories, "/admin/categories", "categories.read"),
        item("review", copy.adminReviewContent, "/admin/people?status=review", "people.read"),
        item("pages", copy.adminCmsPages, null, null, "not_available"),
        item("posts", copy.adminCmsPosts, null, null, "not_available"),
        item("tags", copy.adminCmsTags, null, null, "not_available"),
      ],
    },
    {
      id: "media",
      label: copy.adminMedia,
      items: [item("media-library", copy.adminMedia, "/admin/media", "media.read")],
    },
    {
      id: "appearance",
      label: copy.adminAppearance,
      items: [
        item("site-experience", copy.adminSiteExperienceCenter, "/admin/site", "homepage.read"),
        item("appearance", copy.adminAppearance, "/admin/appearance", "appearance.read"),
        item("identity", copy.adminIdentitySettings, "/admin/appearance/identity", "appearance.read"),
        item("navigation", copy.adminNavigationManager, "/admin/appearance/navigation", "navigation.read"),
        item("footer", copy.adminFooterManager, "/admin/appearance/footer", "footer.read"),
        item("widgets", copy.adminCmsWidgets, null, null, "not_available"),
      ],
    },
    {
      id: "users",
      label: copy.adminUsers,
      items: [
        item("users", copy.adminUsers, "/admin/users", "users.read"),
        item("administrators", copy.adminAdministrators, "/admin/administrators", "admins.read"),
        item("editors", copy.adminEditors, "/admin/editors", "editors.read"),
        item("roles", copy.adminPermissionMatrix, "/admin/roles", "roles.read"),
        item("permissions", copy.adminPermissionOverrides, "/admin/permissions", "permissions.read"),
        item("sessions", copy.adminSessions, "/admin/sessions", "sessions.read"),
      ],
    },
    {
      id: "settings",
      label: copy.adminSettings,
      items: [
        item("settings", copy.adminSettings, "/admin/settings", "settings.read"),
        item("seo", copy.adminSeo, "/admin/seo", "seo.read"),
        item("profile-presentation", copy.adminAppearance, "/admin/profile-presentation", "profile_presentation.read"),
      ],
    },
    {
      id: "tools",
      label: copy.adminSystemGroup,
      items: [
        item("audit", copy.adminAudit, "/admin/audit", "audit.read"),
        item("launch", copy.adminLaunchControl, "/admin/launch", "system.read"),
        item("system", copy.adminSystem, "/admin/system", "system.read"),
      ],
    },
    {
      id: "ai",
      label: copy.adminAi,
      items: [item("ai", copy.adminAi, "/admin/ai", "ai.documents.read")],
    },
  ];
}

export function filterAdminNavigation(
  groups: readonly CmsAdminNavGroup[],
  can: (permission: AdminPermission) => boolean,
): readonly CmsAdminNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((navItem) => navItem.permission === null || can(navItem.permission)),
    }))
    .filter((group) => group.items.length > 0);
}
