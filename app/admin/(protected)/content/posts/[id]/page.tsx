import type { Metadata } from "next";
import Link from "next/link";
import { CmsEditorialEditor } from "@/components/a3lam/CmsEditorialEditor";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";

async function loadTaxonomy() {
  const [categories, tags] = await Promise.all([
    adminRepository.listCategoryOptions().catch(() => []),
    editorialRepository.listTags().catch(() => []),
  ]);
  return { categories: categories.slice(0, 50), tags: tags.slice(0, 50) };
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

async function loadPost(id: string) {
  try {
    return { record: await editorialRepository.get("post", id), unavailable: false };
  } catch {
    return { record: null, unavailable: true };
  }
}

export default async function EditCmsPost({ params }: Props) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("content.read");
  const { id } = await params;
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const result = await loadPost(id);
  if (result.unavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminCmsRequiresMigration}</p><Link className="button" href="/admin/content/posts">{copy.adminCmsBackToContent}</Link></div>;
  if (!result.record) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminNotFound}</p><Link className="button" href="/admin/content/posts">{copy.adminCmsBackToContent}</Link></div>;
  const [canUpdate, canReview, canSchedule, canPublish, canTrash] = access.principal ? await Promise.all(["content.update", "content.review", "content.schedule", "content.publish", "content.trash"].map((permission) => hasEffectiveAdminPermission(access.principal!, permission as Parameters<typeof hasEffectiveAdminPermission>[1]))) : [false, false, false, false, false];
  const capabilities = { canCreate: false, canUpdate, canReview, canSchedule, canPublish, canTrash };
  const taxonomy = await loadTaxonomy();
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminCmsPosts}</p><h1>{result.record.title}</h1></div></header><CmsEditorialEditor kind="post" initialRecord={result.record} copy={copy} capabilities={capabilities} taxonomy={taxonomy} recoveryScope={access.principal?.id ?? "unknown"} /></div>;
}
