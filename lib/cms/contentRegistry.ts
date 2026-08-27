import type { CmsContentTypeDefinition, CmsWidgetDefinition, CmsWidgetId } from "./types";

export const contentTypeRegistry: Readonly<Record<CmsContentTypeDefinition["id"], CmsContentTypeDefinition>> = Object.freeze({
  person: {
    id: "person",
    labelKey: "adminPeople",
    routeBase: "/admin/people",
    storageTable: "people",
    availability: "available",
    domainSpecific: true,
    editor: "person",
    readPermission: "people.read",
    permissions: ["people.read", "people.create", "people.update", "people.publish"],
    actions: ["read", "create", "update", "review", "publish", "archive"],
    supportsDraft: true,
    supportsReview: true,
    supportsPublication: true,
  },
  profile: {
    id: "profile",
    labelKey: "adminProfiles",
    routeBase: "/admin/profiles",
    storageTable: "profiles",
    availability: "available",
    domainSpecific: true,
    editor: "profile",
    readPermission: "profiles.read",
    permissions: ["profiles.read", "profiles.moderate", "profiles.publish"],
    actions: ["read", "review", "publish", "archive"],
    supportsDraft: true,
    supportsReview: true,
    supportsPublication: true,
  },
  category: {
    id: "category",
    labelKey: "adminCategories",
    routeBase: "/admin/categories",
    storageTable: "categories",
    availability: "available",
    domainSpecific: true,
    editor: "category",
    readPermission: "categories.read",
    permissions: ["categories.read", "categories.create", "categories.update"],
    actions: ["read", "create", "update"],
    supportsDraft: false,
    supportsReview: false,
    supportsPublication: false,
  },
  page: {
    id: "page",
    labelKey: "adminCmsPages",
    routeBase: "/admin/content/pages",
    storageTable: "cms_pages",
    availability: "requires_configuration",
    domainSpecific: false,
    editor: "unavailable",
    readPermission: "content.read",
    permissions: ["content.read", "content.create", "content.update", "content.review", "content.publish", "content.schedule", "content.trash"],
    actions: ["read", "create", "update", "review", "publish", "archive"],
    supportsDraft: true,
    supportsReview: true,
    supportsPublication: true,
  },
  post: {
    id: "post",
    labelKey: "adminCmsPosts",
    routeBase: "/admin/content/posts",
    storageTable: "cms_posts",
    availability: "requires_configuration",
    domainSpecific: false,
    editor: "unavailable",
    readPermission: "content.read",
    permissions: ["content.read", "content.create", "content.update", "content.review", "content.publish", "content.schedule", "content.trash"],
    actions: ["read", "create", "update", "review", "publish", "archive"],
    supportsDraft: true,
    supportsReview: true,
    supportsPublication: true,
  },
  tag: {
    id: "tag",
    labelKey: "adminCmsTags",
    routeBase: "/admin/content/tags",
    storageTable: "cms_tags",
    availability: "requires_configuration",
    domainSpecific: false,
    editor: "unavailable",
    readPermission: "taxonomy.read",
    permissions: ["taxonomy.read", "taxonomy.create", "taxonomy.update"],
    actions: ["read", "create", "update"],
    supportsDraft: false,
    supportsReview: false,
    supportsPublication: false,
  },
});

export const widgetRegistry: Readonly<Record<CmsWidgetId, CmsWidgetDefinition>> = Object.freeze({
  "recent-people": { id: "recent-people", label: "أحدث الشخصيات", availability: "available", configuration: "query", renderSafe: true },
  "recent-posts": { id: "recent-posts", label: "أحدث المقالات", availability: "not_available", configuration: "query", renderSafe: true },
  categories: { id: "categories", label: "التصنيفات", availability: "available", configuration: "query", renderSafe: true },
  tags: { id: "tags", label: "الوسوم", availability: "not_available", configuration: "query", renderSafe: true },
  search: { id: "search", label: "البحث", availability: "available", configuration: "none", renderSafe: true },
  "custom-text": { id: "custom-text", label: "نص ثابت", availability: "planned", configuration: "plain-text", renderSafe: true },
});

export function getContentType(id: CmsContentTypeDefinition["id"]): CmsContentTypeDefinition {
  return contentTypeRegistry[id];
}

export function listContentTypes(): readonly CmsContentTypeDefinition[] {
  return Object.values(contentTypeRegistry);
}

export function getWidget(id: CmsWidgetId): CmsWidgetDefinition | null {
  return widgetRegistry[id] ?? null;
}

export function isRegisteredWidget(id: string): id is CmsWidgetId {
  return Object.prototype.hasOwnProperty.call(widgetRegistry, id);
}
