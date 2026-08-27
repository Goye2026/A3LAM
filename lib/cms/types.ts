import type { ReactNode } from "react";
import type { AdminPermission } from "@/lib/admin/rbac";

export type CmsContentTypeId = "person" | "page" | "post";
export type CmsContentAvailability = "available" | "not_available" | "planned";

export type CmsContentTypeDefinition = {
  id: CmsContentTypeId;
  labelKey: string;
  routeBase: string;
  storageTable: "people" | null;
  availability: CmsContentAvailability;
  domainSpecific: boolean;
  supportsDraft: boolean;
  supportsReview: boolean;
  supportsPublication: boolean;
};

export type CmsThemeId = "a3lam-editorial";
export type CmsTemplateId = "index" | "single-person" | "single-post" | "single-page" | "archive" | "search" | "not-found";
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
  availability: "available" | "not_available" | "planned";
  children?: readonly CmsAdminNavItem[];
};

export type CmsAdminNavGroup = {
  id: string;
  label: string;
  items: readonly CmsAdminNavItem[];
};
