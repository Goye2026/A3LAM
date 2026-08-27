"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CmsAdminNavGroup } from "@/lib/cms/types";

function isCurrentPath(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  groups: readonly CmsAdminNavGroup[];
  brand: string;
  controlCenter: string;
  navigationLabel: string;
  unavailableLabel: string;
  openLabel: string;
  closeLabel: string;
};

export function AdminSidebar({ groups, brand, controlCenter, navigationLabel, unavailableLabel, openLabel, closeLabel }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <aside className={`admin-sidebar${mobileOpen ? " is-mobile-open" : ""}`}>
      <button
        className="admin-mobile-nav-toggle"
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="admin-primary-navigation"
        onClick={() => setMobileOpen((current) => !current)}
      >
        <span>{mobileOpen ? closeLabel : openLabel}</span>
        <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
      </button>
      {mobileOpen ? <button className="admin-sidebar-backdrop" type="button" aria-label={closeLabel} onClick={() => setMobileOpen(false)} /> : null}
      <div className="admin-sidebar-content">
        <div className="admin-brand">
          <Link href="/admin" className="brand-lockup" onClick={() => setMobileOpen(false)}>
            <span className="a3lam-brand-mark" aria-hidden="true">{brand.slice(0, 1)}</span>
            <span>
              <strong>{brand}</strong>
              <small>{controlCenter}</small>
            </span>
          </Link>
        </div>
        <nav id="admin-primary-navigation" className="admin-nav" aria-label={navigationLabel}>
          <span className="admin-nav-current-label">{controlCenter}</span>
          {groups.map((group) => (
            <details className="admin-nav-group" key={group.id} open>
              <summary className="admin-nav-group-label">{group.label}</summary>
              <div className="admin-nav-group-links">
                {group.items.map((navItem) => {
                  if (navItem.availability !== "available" || !navItem.href) {
                    return <span className="admin-nav-link is-disabled" aria-disabled="true" key={navItem.id}>{navItem.label}<small>{unavailableLabel}</small></span>;
                  }
                  const current = isCurrentPath(navItem.href, pathname);
                  return <Link href={navItem.href} className="admin-nav-link" aria-current={current ? "page" : undefined} key={navItem.id} onClick={() => setMobileOpen(false)}>{navItem.label}</Link>;
                })}
              </div>
            </details>
          ))}
        </nav>
      </div>
    </aside>
  );
}
