"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LogoutPageClient() {
  const router = useRouter();
  useEffect(() => {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.replace("/");
      router.refresh();
    });
  }, [router]);
  return <p className="route-description" role="status">جارٍ تسجيل الخروج…</p>;
}
