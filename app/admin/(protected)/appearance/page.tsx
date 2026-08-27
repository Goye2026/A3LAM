import type { Metadata } from "next";
import Link from "next/link";
import { AdminSiteExperiencePage } from "@/components/a3lam/AdminSiteExperiencePage";
import { AdminStatusBadge } from "@/components/a3lam/AdminDesignSystem";
import { activeTheme } from "@/lib/cms/themeRegistry";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Appearance · A3LAM", robots: { index: false, follow: false } };

export default function AdminAppearancePage() {
  const copy = getMessages(defaultLocale);
  const surfaces = [
    { href: "/admin/appearance", label: copy.adminThemeSettings, detail: copy.adminSiteExperienceDescription, available: true },
    { href: "/admin/appearance/identity", label: copy.adminIdentitySettings, detail: copy.adminBrandDescription, available: true },
    { href: "/admin/site", label: copy.adminHomepageBuilder, detail: copy.adminSiteExperienceCenterDescription, available: true },
    { href: "/admin/appearance/navigation", label: copy.adminNavigationManager, detail: copy.adminNavigationStyle, available: true },
    { href: "/admin/appearance/footer", label: copy.adminFooterManager, detail: copy.adminFooterStyle, available: true },
    { href: null, label: copy.adminCmsWidgets, detail: copy.adminCmsUnavailable, available: false },
  ] as const;

  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div><p className="eyebrow">{copy.adminAppearance}</p><h1>{copy.adminAppearance}</h1><p className="route-description">{copy.adminSiteExperienceDescription}</p></div>
      </header>
      <section className="admin-panel admin-appearance-grid" aria-label={copy.adminAppearance}>
        {surfaces.map((surface) => surface.available && surface.href ? <Link className="admin-action-card" href={surface.href} key={surface.label}><strong>{surface.label}</strong><span>{surface.detail}</span><small className="admin-content-type-status is-available">{copy.adminAvailable}</small></Link> : <div className="admin-action-card is-disabled" aria-disabled="true" key={surface.label}><strong>{surface.label}</strong><span>{surface.detail}</span><small className="admin-content-type-status">{copy.adminUnavailable}</small></div>)}
      </section>
      <section className="admin-panel" aria-labelledby="active-theme-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="active-theme-title">{copy.adminTheme}</h2>
            <p className="route-description">{activeTheme.name} · v{activeTheme.version}</p>
          </div>
          <AdminStatusBadge label={copy.adminAvailable} tone="success" />
        </div>
        <p className="admin-muted">{copy.adminSiteExperienceStatus}: {activeTheme.capabilities.join(" · ")}</p>
      </section>
      <AdminSiteExperiencePage resource="appearance" title={copy.adminAppearance} />
    </div>
  );
}
