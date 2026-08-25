import Link from "next/link";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function AdminContentPage() {
  const copy = getMessages(defaultLocale);
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminPeopleGroup}</p><h1>{copy.adminContent}</h1><p className="route-description">{copy.adminControlCenterDescription}</p></div></header><section className="admin-panel admin-link-grid" aria-label={copy.adminContent}><Link className="admin-action-card" href="/admin/people"><strong>{copy.adminPeople}</strong><span>{copy.adminEdit}</span></Link><Link className="admin-action-card" href="/admin/categories"><strong>{copy.adminCategories}</strong><span>{copy.adminEdit}</span></Link><Link className="admin-action-card" href="/admin/profiles"><strong>{copy.adminProfiles}</strong><span>{copy.adminReviewContent}</span></Link></section></div>;
}
