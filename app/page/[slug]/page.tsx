import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsRichTextRenderer } from "@/components/a3lam/CmsRichTextRenderer";
import { SiteFrame } from "@/components/a3lam/SiteFrame";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo/site";
import { toCmsEditorialViewModel } from "@/lib/cms/templateContracts";

type Props = { params: Promise<{ slug: string }> };

async function getPage(slug: string) {
  try {
    return await editorialRepository.getPublishedBySlug("page", slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = await getPage(slug);
  if (!record) return { title: "A3LAM" };
  return { title: record.seoTitle || record.title, description: record.seoDescription || record.excerpt || undefined, alternates: { canonical: record.canonicalUrl || absoluteUrl(`/page/${record.slug}`) }, openGraph: { title: record.seoTitle || record.title, description: record.seoDescription || record.excerpt || undefined, url: absoluteUrl(`/page/${record.slug}`), type: "article" } };
}

export default async function PublicCmsPage({ params }: Props) {
  const { slug } = await params;
  const record = await getPage(slug);
  if (!record) notFound();
  const copy = getMessages(defaultLocale);
  const viewModel = toCmsEditorialViewModel(record);
  return <SiteFrame copy={copy} active="home" template={viewModel.template}><main className="public-page cms-public-content"><article><header className="public-page-header"><p className="eyebrow">{copy.adminCmsPages}</p><h1>{viewModel.title}</h1>{viewModel.excerpt && <p className="route-description">{viewModel.excerpt}</p>}</header><CmsRichTextRenderer document={viewModel.content} /></article></main></SiteFrame>;
}
