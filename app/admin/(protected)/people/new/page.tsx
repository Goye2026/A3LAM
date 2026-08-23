import type { Metadata } from "next";
import type { Category } from "@/lib/domain/a3lam";
import Link from "next/link";
import { AdminPersonForm } from "@/components/a3lam/AdminPersonForm";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "New person | A3LAM", robots: { index: false, follow: false } };

export default async function NewPersonPage() {
  const copy = getMessages(defaultLocale);
  let categories: Category[] = [];
  let unavailable = false;
  try { categories = await adminRepository.listCategoryOptions(); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><Link className="admin-back-link" href="/admin/people">{copy.adminPeople}</Link><p className="eyebrow">{copy.adminTitle}</p><h1>{copy.adminPersonNew}</h1></div></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : <AdminPersonForm copy={copy} categories={categories} />}</div>;
}
