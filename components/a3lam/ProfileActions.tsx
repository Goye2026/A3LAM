"use client";

import { useState } from "react";

export function ProfileActions({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setMessage("تم نسخ الرابط"); }
    } catch {
      setMessage("تعذر المشاركة");
    }
  }
  return <div className="profile-actions"><button className="button button-quiet" type="button" onClick={() => void share()}>مشاركة الملف</button><button className="button button-quiet" type="button" onClick={() => window.print()}>طباعة</button>{message ? <span role="status">{message}</span> : null}</div>;
}
