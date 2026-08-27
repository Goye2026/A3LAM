"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CmsAdminNavGroup } from "@/lib/cms/types";

function isCurrentPath(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ groups, brand, controlCenter, unavailableLabel }: { groups: readonly CmsAdminNavGroup[]; brand: string; controlCenter: string; unavailableLabel: string }) {
  const pathname = usePathname();
  return (
    <aside className="admin-sidebar" aria-label={controlCenter}>
      <div className="admin-brand">
        <Link href="/admin" className="brand-lockup">
          <span className="a3lam-brand-mark" aria-hidden="true">أ</span>
          <span>
            <strong>{brand}</strong>
            <small>{controlCenter}</small>
          </span>
        </Link>
      </div>
      <nav className="admin-nav" aria-label={controlCenter}>
        {groups.map((group) => (
          <details className="admin-nav-group" key={group.id} open>
            <summary className="admin-nav-group-label">{group.label}</summary>
            <div className="admin-nav-group-links">
              {group.items.map((navItem) => {
                if (navItem.availability !== "available" || !navItem.href) {
                  return <span className="admin-nav-link is-disabled" aria-disabled="true" key={navItem.id}>{navItem.label}<small>{unavailableLabel}</small></span>;
                }
                const current = isCurrentPath(navItem.href, pathname);
                return <Link href={navItem.href} className="admin-nav-link" aria-current={current ? "page" : undefined} key={navItem.id}>{navItem.label}</Link>;
              })}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
