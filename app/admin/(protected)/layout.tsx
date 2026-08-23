import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/a3lam/AdminShell";
import { requireAdminPage } from "@/lib/admin/pageAuth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
