import type { Metadata } from "next";
import Link from "next/link";
import { CmsRichTextRenderer } from "@/components/a3lam/CmsRichTextRenderer";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";

export const metadata: Metadata = { title: "CMS Preview | A3LAM", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

async function loadPost(id: string) {
  try {
    return { record: await editorialRepository.get("post", id), unavailable: false };
  } catch {
    return { record: null, unavailable: true };
  }
}

export default async function CmsPostPreview({ params }: Props) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("content.read");
  const { id } = await params;
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const result = await loadPost(id);
  if (result.unavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminCmsRequiresMigration}</p></div>;
  if (!result.record) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminNotFound}</p></div>;
  return <article className="admin-route cms-preview"><header className="admin-route-heading"><div><Link className="admin-back-link" href={`/admin/content/posts/${id}`}>{copy.adminBackToEdit}</Link><p className="eyebrow">{copy.adminPreviewTitle}</p><h1>{result.record.title}</h1><p className="route-description">{copy.adminPreviewDescription}</p></div></header><CmsRichTextRenderer document={result.record.content} /></article>;
}
