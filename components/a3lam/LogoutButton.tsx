"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = { label: string; busyLabel: string };

export function LogoutButton({ label, busyLabel }: LogoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return <button className="button button-quiet" onClick={logout} disabled={busy}>{busy ? busyLabel : label}</button>;
}
