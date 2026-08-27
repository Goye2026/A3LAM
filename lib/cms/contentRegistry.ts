import type { CmsContentTypeDefinition, CmsWidgetDefinition, CmsWidgetId } from "./types";

export const contentTypeRegistry: Readonly<Record<CmsContentTypeDefinition["id"], CmsContentTypeDefinition>> = Object.freeze({
  person: {
    id: "person",
    labelKey: "adminPeople",
    routeBase: "/admin/people",
    storageTable: "people",
    availability: "available",
    domainSpecific: true,
    supportsDraft: true,
    supportsReview: true,
    supportsPublication: true,
  },
  page: {
    id: "page",
    labelKey: "adminCmsPages",
    routeBase: "/admin/content/pages",
    storageTable: null,
    availability: "not_available",
    domainSpecific: false,
    supportsDraft: false,
    supportsReview: false,
    supportsPublication: false,
  },
  post: {
    id: "post",
    labelKey: "adminCmsPosts",
    routeBase: "/admin/content/posts",
    storageTable: null,
    availability: "not_available",
    domainSpecific: false,
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

export function getWidget(id: CmsWidgetId): CmsWidgetDefinition | null {
  return widgetRegistry[id] ?? null;
}

export function isRegisteredWidget(id: string): id is CmsWidgetId {
  return Object.prototype.hasOwnProperty.call(widgetRegistry, id);
}
