import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { siteExperienceRepository } from "@/lib/site-experience/repository";

export const metadata: Metadata = { title: "Homepage preview · A3LAM", robots: { index: false, follow: false } };

export default async function AdminHomepagePreviewPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "homepage.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  let item: Awaited<ReturnType<typeof siteExperienceRepository.getAdminResource<"homepage">>>;
  try {
    item = await siteExperienceRepository.getAdminResource("homepage");
  } catch {
    return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminRequiresSchema}</p></div>;
  }
  const sections = [...item.draft.sections].sort((a, b) => a.order - b.order).filter((section) => section.visible);
  return <div className="admin-route admin-preview-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminPreview}</p><h1>{item.draft.hero.title}</h1><p className="route-description">{copy.adminPreviewDescription}</p></div><a className="button button-quiet" href="/admin/homepage">{copy.adminEdit}</a></header><section className="admin-preview-hero"><p className="eyebrow">{item.draft.hero.eyebrow}</p><h2>{item.draft.hero.title}</h2><p>{item.draft.hero.subtitle}</p><div className="hero-actions"><span className="button button-primary">{item.draft.hero.primary.label}</span><span className="button button-quiet">{item.draft.hero.secondary.label}</span></div></section><section className="admin-panel"><h2>{copy.adminSectionOrder}</h2><ol className="admin-preview-section-list">{sections.map((section) => <li key={section.key}>{section.key}</li>)}</ol></section></div>;
}
