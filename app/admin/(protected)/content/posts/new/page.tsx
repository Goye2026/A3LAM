import { CmsEditorialEditor } from "@/components/a3lam/CmsEditorialEditor";
import { getMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/lib/i18n/config";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { adminRepository } from "@/lib/data/adminRepository";
import { editorialRepository } from "@/lib/cms/editorialRepository";

async function loadTaxonomy() {
  const [categories, tags] = await Promise.all([
    adminRepository.listCategoryOptions().catch(() => []),
    editorialRepository.listTags().catch(() => []),
  ]);
  return { categories: categories.slice(0, 50), tags: tags.slice(0, 50) };
}

export default async function NewCmsPost() {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("content.create");
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const [canUpdate, canReview, canSchedule, canPublish, canTrash] = access.principal ? await Promise.all(["content.update", "content.review", "content.schedule", "content.publish", "content.trash"].map((permission) => hasEffectiveAdminPermission(access.principal!, permission as Parameters<typeof hasEffectiveAdminPermission>[1]))) : [false, false, false, false, false];
  const capabilities = { canCreate: true, canUpdate, canReview, canSchedule, canPublish, canTrash };
  const taxonomy = await loadTaxonomy();
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminContent}</p><h1>{copy.adminCmsCreatePost}</h1></div></header><CmsEditorialEditor kind="post" initialRecord={null} copy={copy} capabilities={capabilities} taxonomy={taxonomy} recoveryScope={access.principal?.id ?? "unknown"} /></div>;
}
