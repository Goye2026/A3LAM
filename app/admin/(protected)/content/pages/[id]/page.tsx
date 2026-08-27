import type { Metadata } from "next";
import Link from "next/link";
import { CmsEditorialEditor } from "@/components/a3lam/CmsEditorialEditor";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

async function loadPage(id: string) {
  try {
    return { record: await editorialRepository.get("page", id), unavailable: false };
  } catch {
    return { record: null, unavailable: true };
  }
}

export default async function EditCmsPage({ params }: Props) {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("content.read");
  const { id } = await params;
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const result = await loadPage(id);
  if (result.unavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminCmsRequiresMigration}</p><Link className="button" href="/admin/content/pages">{copy.adminCmsBackToContent}</Link></div>;
  if (!result.record) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminNotFound}</p><Link className="button" href="/admin/content/pages">{copy.adminCmsBackToContent}</Link></div>;
  const [canUpdate, canReview, canSchedule, canPublish, canTrash] = access.principal ? await Promise.all(["content.update", "content.review", "content.schedule", "content.publish", "content.trash"].map((permission) => hasEffectiveAdminPermission(access.principal!, permission as Parameters<typeof hasEffectiveAdminPermission>[1]))) : [false, false, false, false, false];
  const capabilities = { canCreate: false, canUpdate, canReview, canSchedule, canPublish, canTrash };
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminCmsPages}</p><h1>{result.record.title}</h1></div></header><CmsEditorialEditor kind="page" initialRecord={result.record} copy={copy} capabilities={capabilities} /></div>;
}
