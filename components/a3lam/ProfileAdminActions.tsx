"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileAdminActions({ profileId, status, canModerate, canPublish }: { profileId: string; status: "draft" | "pending_review" | "published" | "archived"; canModerate: boolean; canPublish: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function transition(nextStatus: "draft" | "published" | "archived") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json() as { message?: string };
      if (!response.ok) setError(data.message || "تعذر تحديث الحالة"); else router.refresh();
    } catch { setError("تعذر الاتصال بخدمة المراجعة"); }
    setBusy(false);
  }
  return <div className="profile-admin-actions">{error ? <p className="admin-alert" role="alert">{error}</p> : null}{status === "pending_review" ? <>{canPublish ? <button className="button button-primary" disabled={busy} onClick={() => void transition("published")}>{busy ? "جارٍ التنفيذ…" : "موافقة ونشر"}</button> : null}{canModerate ? <button className="button button-quiet" disabled={busy} onClick={() => void transition("draft")}>إرجاع للمسودة</button> : null}</> : null}{status === "published" && canModerate ? <button className="button button-quiet" disabled={busy} onClick={() => void transition("archived")}>أرشفة</button> : null}{status === "archived" && canModerate ? <button className="button button-primary" disabled={busy} onClick={() => void transition("draft")}>استعادة كمسودة</button> : null}</div>;
}
