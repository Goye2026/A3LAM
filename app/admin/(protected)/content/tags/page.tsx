import { CmsTagManager } from "@/components/a3lam/CmsTagManager";
import { editorialRepository } from "@/lib/cms/editorialRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getAdminPageAccess } from "@/lib/admin/pageAuth";

async function loadTags() {
  try {
    return { tags: await editorialRepository.listTags(), unavailable: false };
  } catch {
    return { tags: [], unavailable: true };
  }
}

export default async function AdminCmsTagsPage() {
  const copy = getMessages(defaultLocale);
  const access = await getAdminPageAccess("taxonomy.read");
  if (!access.allowed) return <div className="admin-route"><p className="admin-alert" role="alert">{access.dependencyUnavailable ? copy.adminRequiresSchema : copy.adminUnauthorized}</p></div>;
  const result = await loadTags();
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminContent}</p><h1>{copy.adminCmsTags}</h1><p className="route-description">{copy.adminCmsEditor}</p></div></header>{result.unavailable ? <section className="admin-panel"><p className="admin-alert" role="status">{copy.adminCmsRequiresMigration}</p></section> : <CmsTagManager initialTags={result.tags} copy={copy} />}</div>;
}
