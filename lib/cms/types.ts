import type { ReactNode } from "react";
import type { AdminPermission } from "@/lib/admin/rbac";
import type { FoundationMessages } from "@/lib/i18n/messages";

export type CmsContentTypeId = "person" | "profile" | "category" | "page" | "post" | "tag";
export type CmsContentAvailability = "available" | "requires_configuration" | "not_available" | "planned";
export type CmsContentAction = "read" | "create" | "update" | "review" | "publish" | "archive";
export type CmsContentEditor = "person" | "profile" | "category" | "unavailable";
export type CmsStorageTable = "people" | "profiles" | "categories" | "cms_pages" | "cms_posts" | "cms_tags" | null;

export type CmsContentTypeDefinition = {
  id: CmsContentTypeId;
  labelKey: keyof FoundationMessages;
  routeBase: string | null;
  storageTable: CmsStorageTable;
  availability: CmsContentAvailability;
  domainSpecific: boolean;
  editor: CmsContentEditor;
  readPermission: AdminPermission | null;
  permissions: readonly AdminPermission[];
  actions: readonly CmsContentAction[];
  supportsDraft: boolean;
  supportsReview: boolean;
  supportsPublication: boolean;
};

export type CmsThemeId = "a3lam-editorial";
export type CmsTemplateId = "index" | "single-person" | "single-post" | "single-page" | "archive" | "category" | "tag" | "search" | "not-found";
export type CmsLayoutPartId = "header" | "footer" | "sidebar" | "content";

export type CmsThemeDefinition = {
  id: CmsThemeId;
  name: string;
  version: string;
  author: string;
  status: "active" | "available";
  templates: readonly CmsTemplateId[];
  layoutParts: readonly CmsLayoutPartId[];
  capabilities: readonly string[];
  settingsResource: "appearance";
};

export type CmsRenderContext = {
  theme: CmsThemeDefinition;
  template: CmsTemplateId;
  locale: "ar" | "en";
  direction: "rtl" | "ltr";
};

export type CmsTemplateResolver = (requested: CmsTemplateId, theme: CmsThemeDefinition) => CmsTemplateId;
export type CmsLayoutResolver = (part: CmsLayoutPartId, theme: CmsThemeDefinition) => CmsLayoutPartId;
export type CmsTemplateRenderer = (props: { children?: ReactNode; context: CmsRenderContext }) => ReactNode;

export type CmsMenuLocation = "primary" | "footer" | "admin-primary";
export type CmsMenuTarget = "_self" | "_blank";
export type CmsMenuItem = {
  id: string;
  label: string;
  href: string;
  target: CmsMenuTarget;
  parentId: string | null;
  order: number;
  enabled: boolean;
};

export type CmsWidgetId = "recent-people" | "recent-posts" | "categories" | "tags" | "search" | "custom-text";
export type CmsWidgetDefinition = {
  id: CmsWidgetId;
  label: string;
  availability: CmsContentAvailability;
  configuration: "none" | "plain-text" | "query";
  renderSafe: boolean;
};

export type CmsAdminNavItem = {
  id: string;
  label: string;
  href: string | null;
  permission: AdminPermission | null;
  availability: CmsContentAvailability;
  children?: readonly CmsAdminNavItem[];
};

export type CmsAdminNavGroup = {
  id: string;
  label: string;
  items: readonly CmsAdminNavItem[];
};
