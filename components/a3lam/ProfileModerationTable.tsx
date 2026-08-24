"use client";

import { useState } from "react";
import type { ProfileRecord } from "@/lib/user/profileRepository";

const labels = { draft: "مسودة", pending_review: "قيد المراجعة", published: "منشور", archived: "مؤرشف" } as const;

export function ProfileModerationTable({ initialProfiles }: { initialProfiles: ProfileRecord[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  async function transition(id: string, status: "draft" | "published" | "archived") {
    setBusyId(id); setError("");
    const response = await fetch(`/api/admin/profiles/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json() as { profile?: ProfileRecord; message?: string };
    if (!response.ok || !data.profile) setError(data.message || "تعذر تحديث حالة الملف");
    else setProfiles((current) => current.map((item) => item.profile.id === id ? data.profile! : item));
    setBusyId("");
  }
  return <div className="admin-panel profile-moderation"><h2>ملفات المستخدمين</h2>{error ? <p className="admin-alert" role="alert">{error}</p> : null}{profiles.length === 0 ? <p className="admin-empty">لا توجد ملفات مستخدمين بعد.</p> : <div className="admin-recent-list">{profiles.map((item) => <div className="admin-recent-row" key={item.profile.id}><span><strong>{item.profile.nameArabic}</strong><small>{item.profile.professionalTitle || "دون مسمى مهني"} · {item.categories.map((category) => category.name).join("، ") || "دون تصنيف"}</small></span><span className="profile-moderation-actions"><b className={`admin-status admin-status-${item.profile.status}`}>{labels[item.profile.status]}</b>{item.profile.status === "pending_review" ? <><button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "published")}>موافقة ونشر</button><button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>إرجاع للمسودة</button></> : null}{item.profile.status === "published" ? <button className="link-button danger" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "archived")}>أرشفة</button> : null}{item.profile.status === "archived" ? <button className="link-button" disabled={busyId === item.profile.id} onClick={() => void transition(item.profile.id, "draft")}>استعادة كمسودة</button> : null}</span></div>)}</div>}</div>;
}
