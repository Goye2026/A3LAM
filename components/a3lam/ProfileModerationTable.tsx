"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProfileRecord } from "@/lib/user/profileRepository";
import { calculateProfileCompletion } from "@/lib/user/profileCompletion";

const labels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;

export function ProfileModerationTable({ initialProfiles }: { initialProfiles: ProfileRecord[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

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

  return <div className="admin-panel profile-moderation"><div className="admin-section-heading"><div><p className="eyebrow">Moderation</p><h2>ملفات المستخدمين</h2></div><span className="admin-count-label">{profiles.length} ملفًا</span></div>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{profiles.length === 0 ? <p className="admin-empty">لا توجد ملفات مستخدمين بعد.</p> : <div className="admin-profile-table" role="table" aria-label="ملفات المستخدمين"><div className="admin-profile-table-head" role="row"><span>الملف</span><span>التصنيف والموقع</span><span>الحالة</span><span>الإجراء</span></div>{profiles.map((item) => { const completion = calculateProfileCompletion(item); const location = [item.profile.city, item.profile.country].filter(Boolean).join("، "); return <div className="admin-profile-row" role="row" key={item.profile.id}><div><strong>{item.profile.nameArabic || "دون اسم"}</strong><small>{item.profile.professionalTitle || "دون مسمى مهني"}</small><small>{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(item.profile.updatedAt))}</small></div><div><small>{item.categories.map((category) => category.name).join("، ") || "دون تصنيف"}</small><small>{location || "دون موقع"}</small><small className="admin-completion">اكتمال {completion.percent}%</small></div><div><b className={`admin-status admin-status-${item.profile.status}`}>{labels[item.profile.status]}</b><small>{item.profile.visibility === "published" ? "عام" : item.profile.visibility === "unlisted" ? "غير مدرج" : "خاص"}</small></div><div className="profile-moderation-actions"><Link className="link-button" href={`/admin/profiles/${item.profile.id}`}>مراجعة</Link>{item.profile.status === "pending_review" ? <><button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "published")}>موافقة ونشر</button><button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>إرجاع للمسودة</button></> : null}{item.profile.status === "published" ? <button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "archived")}>أرشفة</button> : null}{item.profile.status === "archived" ? <button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>استعادة كمسودة</button> : null}</div></div>;})}</div>}</div>;
}
