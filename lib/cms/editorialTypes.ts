import type { CmsEditorialStatus } from "./editorialStatus";
import type { CmsRichTextDocument } from "./richText";

export type CmsEntityKind = "page" | "post";

export type CmsEditorialRecord = {
  id: string;
  kind: CmsEntityKind;
  title: string;
  slug: string;
  status: CmsEditorialStatus;
  content: CmsRichTextDocument;
  excerpt: string;
  authorId: string | null;
  featuredMediaId: string | null;
  template: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  categoryIds: string[];
  tagIds: string[];
};

export type CmsEditorialRevisionSnapshot = {
  title: string;
  slug: string;
  content: CmsRichTextDocument;
  excerpt: string;
  featuredMediaId: string | null;
  template: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string | null;
  categoryIds: string[];
  tagIds: string[];
};

export type CmsEditorialMutation = {
  title: string;
  slug: string;
  content: CmsRichTextDocument;
  excerpt: string;
  featuredMediaId: string | null;
  template: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string | null;
  categoryIds?: string[];
  tagIds?: string[];
  expectedVersion?: number;
};

export type CmsTagInput = { name: string; slug: string };

export type CmsListOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: CmsEditorialStatus | "";
  authorId?: string;
  sort?: "updated_desc" | "updated_asc" | "title";
};

export type CmsListPage = {
  items: CmsEditorialRecord[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  status: CmsEditorialStatus | "";
};

export type CmsTagRecord = { id: string; name: string; slug: string; createdAt: string; updatedAt: string };
