import type { Metadata } from "next";
import Link from "next/link";
import { AdminPreview } from "@/components/a3lam/AdminPreview";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Preview | A3LAM", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPersonPreviewPage({ params }: PageProps) {
  const copy = getMessages(defaultLocale);
  const { id } = await params;
  let data = null;
  let unavailable = false;
  try { data = await adminRepository.getEditorData(id); } catch { unavailable = true; }
  if (unavailable) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminDatabaseError}</p></div>;
  if (!data) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.notFoundDescription}</p><Link className="button button-quiet" href="/admin/people">{copy.adminPeople}</Link></div>;
  return <div className="admin-route"><div className="admin-route-heading"><div><Link className="admin-back-link" href={`/admin/people/${encodeURIComponent(id)}`}>{copy.adminBackToEdit}</Link><p className="eyebrow">{copy.adminTitle}</p><h1>{copy.adminPreviewTitle}</h1></div></div><AdminPreview record={data.record} copy={copy} /></div>;
}
