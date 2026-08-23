import type { Metadata } from "next";
import Link from "next/link";
import { AdminPersonForm } from "@/components/a3lam/AdminPersonForm";
import { adminRepository } from "@/lib/data/adminRepository";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Edit person | A3LAM", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPersonPage({ params }: PageProps) {
  const copy = getMessages(defaultLocale);
  const { id } = await params;
  let data = null;
  let unavailable = false;
  try { data = await adminRepository.getEditorData(id); } catch { unavailable = true; }
  return <div className="admin-route"><header className="admin-route-heading"><div><Link className="admin-back-link" href="/admin/people">{copy.adminPeople}</Link><p className="eyebrow">{copy.adminTitle}</p><h1>{data?.record.person.nameArabic ?? copy.adminPersonEdit}</h1></div><Link className="button button-quiet" href={`/admin/people/${encodeURIComponent(id)}/preview`}>{copy.adminPreview}</Link></header>{unavailable ? <p className="admin-alert" role="alert">{copy.adminDatabaseError}</p> : !data ? <p className="admin-alert" role="alert">{copy.notFoundDescription}</p> : <AdminPersonForm copy={copy} categories={data.categories} record={data.record} personId={id} />}</div>;
}
