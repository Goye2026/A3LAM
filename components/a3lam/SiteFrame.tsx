import type { ReactNode } from "react";
import { SiteFooter } from "@/components/a3lam/SiteFooter";
import { SiteHeader } from "@/components/a3lam/SiteHeader";
import type { PublicMessages } from "@/lib/i18n/messages";
import { createRenderContext } from "@/lib/cms/themeRenderer";
import type { CmsTemplateId } from "@/lib/cms/types";

type SiteFrameProps = {
  children: ReactNode;
  copy: PublicMessages;
  footerCopy?: PublicMessages;
  active?: "home" | "people" | "categories" | "about" | "search" | "contact" | "privacy";
  template?: CmsTemplateId;
  sidebar?: ReactNode;
};

export async function SiteFrame({ children, copy, footerCopy = copy, active = "home", template = "index", sidebar }: SiteFrameProps) {
  const context = createRenderContext(template, "ar");
  return (
    <div className="a3lam-site-frame" data-cms-theme={context.theme.id} data-cms-template={context.template} dir={context.direction}>
      <div className="a3lam-shell site-frame-header"><SiteHeader copy={copy} active={active} /></div>
      <div className={`site-frame-layout${sidebar ? " has-sidebar" : ""}`}>
        <div className="site-frame-main">{children}</div>
        {sidebar ? <aside className="site-frame-sidebar" aria-label={copy.siteName}>{sidebar}</aside> : null}
      </div>
      <div className="a3lam-shell site-frame-footer"><SiteFooter copy={footerCopy} /></div>
    </div>
  );
}
