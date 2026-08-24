"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProfileRecord } from "@/lib/user/profileRepository";
import { calculateProfileCompletion } from "@/lib/user/profileCompletion";
import type { FoundationMessages } from "@/lib/i18n/messages";

const labels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;
type StatusFilter = "" | keyof typeof labels;
type SortMode = "updated" | "completion" | "name";

type ProfileModerationTableProps = {
  initialProfiles: ProfileRecord[];
  copy?: Pick<FoundationMessages, "moderationSearchPlaceholder" | "moderationAllCategories" | "moderationSortLabel" | "moderationSortUpdated" | "moderationSortCompletion" | "moderationSortName" | "moderationShowing" | "moderationNoMatch">;
};

const fallbackCopy = {
  moderationSearchPlaceholder: "ابحث بالاسم أو المسمى أو المدينة…",
  moderationAllCategories: "كل التصنيفات",
  moderationSortLabel: "ترتيب النتائج",
  moderationSortUpdated: "الأحدث تعديلًا",
  moderationSortCompletion: "الأعلى اكتمالًا",
  moderationSortName: "الاسم أبجديًا",
  moderationShowing: "عرض",
  moderationNoMatch: "لا توجد ملفات تطابق أدوات التصفية الحالية.",
} satisfies ProfileModerationTableProps["copy"];

export function ProfileModerationTable({ initialProfiles, copy = fallbackCopy }: ProfileModerationTableProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");

  const categoryOptions = useMemo(() => Array.from(new Set(profiles.flatMap((item) => item.categories.map((category) => category.name)))).sort((left, right) => left.localeCompare(right, "ar")), [profiles]);
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");
    return profiles
      .filter((item) => {
        const profile = item.profile;
        const searchable = [profile.nameArabic, profile.name, profile.professionalTitle, profile.city ?? "", profile.country ?? "", ...item.categories.map((category) => category.name)].join(" ").toLocaleLowerCase("ar");
        return (!normalizedQuery || searchable.includes(normalizedQuery)) && (!statusFilter || profile.status === statusFilter) && (!categoryFilter || item.categories.some((category) => category.name === categoryFilter));
      })
      .sort((left, right) => {
        if (sortMode === "name") return left.profile.nameArabic.localeCompare(right.profile.nameArabic, "ar");
        if (sortMode === "completion") return calculateProfileCompletion(right).percent - calculateProfileCompletion(left).percent;
        return new Date(right.profile.updatedAt).getTime() - new Date(left.profile.updatedAt).getTime();
      });
  }, [categoryFilter, profiles, query, sortMode, statusFilter]);

  async function transition(id: string, status: "draft" | "published" | "archived") {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/admin/profiles/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json() as { profile?: ProfileRecord; message?: string };
      if (!response.ok || !data.profile) setError(data.message || "تعذر تحديث حالة الملف");
      else setProfiles((current) => current.map((item) => item.profile.id === id ? data.profile! : item));
    } catch { setError("تعذر الاتصال بخدمة المراجعة"); }
    setBusyId("");
  }

  return <div className="admin-panel profile-moderation">
    <div className="admin-section-heading"><div><p className="eyebrow">Moderation</p><h2>ملفات المستخدمين</h2><p className="section-help">ابحث وراجع الملفات حسب الحالة والمجال قبل اتخاذ قرار النشر.</p></div><span className="admin-count-label">{copy.moderationShowing} {filteredProfiles.length} / {profiles.length}</span></div>
    <div className="admin-profile-filters" aria-label="أدوات تصفية الملفات">
      <label><span>بحث في الملفات</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.moderationSearchPlaceholder} /></label>
      <label><span>الحالة</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="">كل الحالات</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label><span>التصنيف</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">{copy.moderationAllCategories}</option>{categoryOptions.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
      <label><span>{copy.moderationSortLabel}</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="updated">{copy.moderationSortUpdated}</option><option value="completion">{copy.moderationSortCompletion}</option><option value="name">{copy.moderationSortName}</option></select></label>
    </div>
    {error ? <p className="admin-alert" role="alert">{error}</p> : null}
    {profiles.length === 0 ? <p className="admin-empty">لا توجد ملفات مستخدمين بعد.</p> : filteredProfiles.length === 0 ? <p className="admin-empty" role="status">{copy.moderationNoMatch}</p> : <div className="admin-profile-table" role="table" aria-label="ملفات المستخدمين"><div className="admin-profile-table-head" role="row"><span>الملف</span><span>التصنيف والموقع</span><span>الحالة</span><span>الإجراء</span></div>{filteredProfiles.map((item) => { const completion = calculateProfileCompletion(item); const location = [item.profile.city, item.profile.country].filter(Boolean).join("، "); return <div className="admin-profile-row" role="row" key={item.profile.id}><div><strong>{item.profile.nameArabic || "دون اسم"}</strong><small>{item.profile.professionalTitle || "دون مسمى مهني"}</small><small>{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(item.profile.updatedAt))}</small></div><div><small>{item.categories.map((category) => category.name).join("، ") || "دون تصنيف"}</small><small>{location || "دون موقع"}</small><small className="admin-completion">اكتمال {completion.percent}%</small></div><div><b className={`admin-status admin-status-${item.profile.status}`}>{labels[item.profile.status]}</b><small>{item.profile.visibility === "published" ? "عام" : item.profile.visibility === "unlisted" ? "غير مدرج" : "خاص"}</small></div><div className="profile-moderation-actions"><Link className="link-button" href={`/admin/profiles/${item.profile.id}`}>مراجعة</Link>{item.profile.status === "pending_review" ? <><button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "published")}>موافقة ونشر</button><button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>إرجاع للمسودة</button></> : null}{item.profile.status === "published" ? <button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "archived")}>أرشفة</button> : null}{item.profile.status === "archived" ? <button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>استعادة كمسودة</button> : null}</div></div>;})}</div>}
  </div>;
}
