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
};

export async function SiteFrame({ children, copy, footerCopy = copy, active = "home", template = "index" }: SiteFrameProps) {
  const context = createRenderContext(template, "ar");
  return (
    <div className="a3lam-site-frame" data-cms-theme={context.theme.id} data-cms-template={context.template} dir={context.direction}>
      <SiteHeader copy={copy} active={active} />
      {children}
      <SiteFooter copy={footerCopy} />
    </div>
  );
}
