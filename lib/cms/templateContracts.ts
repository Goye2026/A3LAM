import type { CmsEditorialRecord } from "./editorialTypes";
import type { CmsRichTextDocument } from "./richText";

export type CmsEditorialViewModel = Readonly<{
  id: string;
  kind: "page" | "post";
  title: string;
  slug: string;
  excerpt: string;
  content: CmsRichTextDocument;
  template: "single-page" | "single-post";
  canonicalUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  categoryIds: readonly string[];
  tagIds: readonly string[];
  featuredMediaId: string | null;
  updatedAt: string;
  publishedAt: string;
}>;

export type CmsPageViewModel = CmsEditorialViewModel & { kind: "page"; template: "single-page" };
export type CmsPostViewModel = CmsEditorialViewModel & { kind: "post"; template: "single-post" };
export type CmsArchiveViewModel = Readonly<{ kind: "archive"; title: string; items: readonly CmsEditorialViewModel[]; page: number; pageSize: number; total: number }>;
export type CmsCategoryViewModel = Readonly<{ kind: "category"; slug: string; name: string; items: readonly CmsEditorialViewModel[] }>;
export type CmsTagViewModel = Readonly<{ kind: "tag"; slug: string; name: string; items: readonly CmsEditorialViewModel[] }>;

export function toCmsEditorialViewModel(record: CmsEditorialRecord): CmsPageViewModel | CmsPostViewModel {
  if (record.kind === "page") return { id: record.id, kind: "page", title: record.title, slug: record.slug, excerpt: record.excerpt, content: record.content, template: "single-page", canonicalUrl: record.canonicalUrl, seoTitle: record.seoTitle, seoDescription: record.seoDescription, categoryIds: record.categoryIds, tagIds: record.tagIds, featuredMediaId: record.featuredMediaId, updatedAt: record.updatedAt, publishedAt: record.publishedAt ?? record.updatedAt };
  return { id: record.id, kind: "post", title: record.title, slug: record.slug, excerpt: record.excerpt, content: record.content, template: "single-post", canonicalUrl: record.canonicalUrl, seoTitle: record.seoTitle, seoDescription: record.seoDescription, categoryIds: record.categoryIds, tagIds: record.tagIds, featuredMediaId: record.featuredMediaId, updatedAt: record.updatedAt, publishedAt: record.publishedAt ?? record.updatedAt };
}
