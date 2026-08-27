import type { Metadata } from "next";
import { AdminSiteExperiencePage } from "@/components/a3lam/AdminSiteExperiencePage";
import { AdminStatusBadge } from "@/components/a3lam/AdminDesignSystem";
import { activeTheme } from "@/lib/cms/themeRegistry";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Appearance · A3LAM", robots: { index: false, follow: false } };

export default function AdminAppearancePage() {
  const copy = getMessages(defaultLocale);
  return (
    <div className="admin-route">
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
