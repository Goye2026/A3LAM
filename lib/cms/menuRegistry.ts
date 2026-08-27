import { getSafePublicUrl } from "@/lib/media/public";
import type { CmsMenuItem, CmsMenuLocation } from "./types";

export const MAX_MENU_DEPTH = 2;

export function isSafeMenuHref(href: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith("//") || /^(javascript|data|vbscript):/i.test(value)) return false;
  if (value.startsWith("/")) return true;
  return getSafePublicUrl(value) !== null;
}

export function isValidMenuItem(item: CmsMenuItem): boolean {
  return Boolean(
    item.id.trim() &&
      item.label.trim() &&
      Number.isInteger(item.order) &&
      item.order >= 0 &&
      isSafeMenuHref(item.href) &&
      (item.target === "_self" || item.target === "_blank"),
  );
}

export function validateMenuItems(items: readonly CmsMenuItem[]): { valid: boolean; reason?: string } {
  const ids = new Set<string>();
  const byId = new Map<string, CmsMenuItem>();
  for (const menuItem of items) {
    if (!isValidMenuItem(menuItem)) return { valid: false, reason: "invalid-item" };
    if (ids.has(menuItem.id)) return { valid: false, reason: "duplicate-id" };
    ids.add(menuItem.id);
    byId.set(menuItem.id, menuItem);
  }
  for (const menuItem of items) {
    if (menuItem.parentId === null) continue;
    if (!byId.has(menuItem.parentId)) return { valid: false, reason: "parent-not-found" };
    const ancestors = new Set<string>([menuItem.id]);
    let parentId: string | null = menuItem.parentId;
    let depth = 1;
    while (parentId !== null) {
      if (ancestors.has(parentId)) return { valid: false, reason: "cycle" };
      ancestors.add(parentId);
      depth += 1;
      if (depth > MAX_MENU_DEPTH) return { valid: false, reason: "max-depth" };
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }
  return { valid: true };
}

export function orderMenuItems(items: readonly CmsMenuItem[]): readonly CmsMenuItem[] {
  return [...items]
    .filter((item) => item.enabled && isValidMenuItem(item))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export const defaultMenus: Readonly<Record<CmsMenuLocation, readonly CmsMenuItem[]>> = Object.freeze({
  primary: Object.freeze([
    { id: "home", label: "الرئيسية", href: "/", target: "_self" as const, parentId: null, order: 10, enabled: true },
    { id: "people", label: "الشخصيات", href: "/people", target: "_self" as const, parentId: null, order: 20, enabled: true },
    { id: "categories", label: "التصنيفات", href: "/categories", target: "_self" as const, parentId: null, order: 30, enabled: true },
  ]),
  footer: Object.freeze([
    { id: "about", label: "عن أعلام", href: "/about", target: "_self" as const, parentId: null, order: 10, enabled: true },
    { id: "privacy", label: "الخصوصية", href: "/privacy", target: "_self" as const, parentId: null, order: 20, enabled: true },
  ]),
  "admin-primary": Object.freeze([]),
});

export function getMenu(location: CmsMenuLocation): readonly CmsMenuItem[] {
  return orderMenuItems(defaultMenus[location] ?? []);
}
