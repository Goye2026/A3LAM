import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsRichTextRenderer } from "@/components/a3lam/CmsRichTextRenderer";
import { SiteFrame } from "@/components/a3lam/SiteFrame";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
  try {
    return await editorialRepository.getPublishedBySlug("post", slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = await getArticle(slug);
  if (!record) return { title: "A3LAM" };
  return { title: record.seoTitle || record.title, description: record.seoDescription || record.excerpt || undefined, alternates: { canonical: record.canonicalUrl || absoluteUrl(`/article/${record.slug}`) }, openGraph: { title: record.seoTitle || record.title, description: record.seoDescription || record.excerpt || undefined, url: absoluteUrl(`/article/${record.slug}`), type: "article" } };
}

export default async function PublicCmsArticle({ params }: Props) {
  const { slug } = await params;
  const record = await getArticle(slug);
  if (!record) notFound();
  const copy = getMessages(defaultLocale);
  return <SiteFrame copy={copy} active="home" template="single-post"><main className="public-page cms-public-content"><article><header className="public-page-header"><p className="eyebrow">{copy.adminCmsPosts}</p><h1>{record.title}</h1>{record.excerpt && <p className="route-description">{record.excerpt}</p>}</header><CmsRichTextRenderer document={record.content} /></article></main></SiteFrame>;
}
