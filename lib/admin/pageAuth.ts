import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminPrincipal } from "@/lib/admin/auth";

export async function requireAdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await getAdminPrincipal(session))) redirect("/admin/login");
}
