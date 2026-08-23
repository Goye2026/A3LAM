"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      className="admin-sidebar-action"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/admin/auth", { method: "DELETE" });
        } finally {
          router.push("/admin/login");
        }
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
