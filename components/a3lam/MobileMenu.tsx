"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { PublicMessages } from "@/lib/i18n/messages";

type MobileMenuLink = { href: string; label: string };

type MobileMenuProps = {
  copy: PublicMessages;
  links: MobileMenuLink[];
};

export function MobileMenu({ copy, links }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="a3lam-mobile-menu">
      <button
        className="a3lam-mobile-menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? copy.closeMenu : copy.menuLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" className="mobile-menu-icon">{open ? "×" : "☰"}</span>
        <span>{open ? copy.closeMenu : copy.menuLabel}</span>
      </button>
      {open ? (
        <nav className="a3lam-mobile-menu-panel" id={panelId} aria-label={copy.siteName}>
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
