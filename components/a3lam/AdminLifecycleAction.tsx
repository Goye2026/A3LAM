"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLifecycleAction({ id, status, label, errorMessage }: { id: string; status: "draft" | "review" | "published" | "archived"; label: string; errorMessage: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const nextStatus = status === "draft" ? "review" : status === "review" ? "published" : status === "published" ? "archived" : "review";
  return (
    <button
      type="button"
      className="admin-table-action"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setError("");
        try {
          const response = await fetch(`/api/admin/people/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          });
          if (!response.ok) throw new Error("transition failed");
          router.refresh();
        } catch {
          setError(errorMessage);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : label}
      {error ? <span className="sr-only" role="alert">{error}</span> : null}
    </button>
  );
}
