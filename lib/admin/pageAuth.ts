import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission, type AdminPermission } from "@/lib/admin/rbac";
import type { AdminPrincipal } from "@/lib/admin/types";

export async function requireAdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await getAdminPrincipal(session))) redirect("/admin/login");
}

export async function getAdminPageAccess(permission: AdminPermission): Promise<{ principal: AdminPrincipal | null; allowed: boolean; dependencyUnavailable: boolean }> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  let principal: AdminPrincipal | null = null;
  try {
    principal = await getAdminPrincipal(session);
  } catch {
    return { principal: null, allowed: false, dependencyUnavailable: true };
  }
  if (!principal) return { principal: null, allowed: false, dependencyUnavailable: false };
  try {
    return { principal, allowed: await hasEffectiveAdminPermission(principal, permission), dependencyUnavailable: false };
  } catch {
    return { principal: null, allowed: false, dependencyUnavailable: true };
  }
}
