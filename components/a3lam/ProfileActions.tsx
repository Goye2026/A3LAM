"use client";

import { useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";

type ProfileActionCopy = Pick<FoundationMessages, "profileShare" | "profilePrint" | "profileCopied" | "profileShareFailed">;

const fallbackCopy: ProfileActionCopy = {
  profileShare: "مشاركة الملف",
  profilePrint: "طباعة الملف",
  profileCopied: "تم نسخ رابط الملف",
  profileShareFailed: "تعذرت المشاركة؛ يمكنك نسخ الرابط يدويًا.",
};

export function ProfileActions({ title, copy = fallbackCopy }: { title: string; copy?: ProfileActionCopy }) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage(copy.profileCopied);
    } catch {
      setMessage(copy.profileShareFailed);
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("");
      } else {
        await copyLink();
      }
    } catch {
      setMessage(copy.profileShareFailed);
    }
  }

  function openShare(target: "whatsapp" | "linkedin" | "facebook" | "x") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const targets = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://x.com/intent/post?text=${text}&url=${url}`,
    };
    window.open(targets[target], "_blank", "noopener,noreferrer");
  }

  return <div className="profile-actions" aria-label="أدوات الملف">
    <button className="button button-quiet" type="button" onClick={() => void share()}>{copy.profileShare}</button>
    <button className="button button-quiet" type="button" onClick={() => void copyLink()}>{copy.profileCopied}</button>
    <button className="button button-quiet" type="button" onClick={() => window.print()}>{copy.profilePrint}</button>
    <div className="profile-share-links" aria-label="مشاركة عبر المنصات">
      <button type="button" onClick={() => openShare("whatsapp")}>WhatsApp</button>
      <button type="button" onClick={() => openShare("linkedin")}>LinkedIn</button>
      <button type="button" onClick={() => openShare("facebook")}>Facebook</button>
      <button type="button" onClick={() => openShare("x")}>X</button>
    </div>
    {message ? <span role="status">{message}</span> : null}
  </div>;
}
