"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ copy, nextPath }: { copy: { adminAccessToken: string; adminLoginAction: string; adminInvalidAccess: string; adminAccessUnavailable: string; adminSaving: string }; nextPath: string }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        setError(response.status === 503 ? copy.adminAccessUnavailable : copy.adminInvalidAccess);
        return;
      }
      router.push(nextPath);
    } catch {
      setError(copy.adminInvalidAccess);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-token">{copy.adminAccessToken}</label>
      <input
        id="admin-token"
        className="admin-input"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        autoComplete="current-password"
        required
      />
      {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={busy}>
        {busy ? copy.adminSaving : copy.adminLoginAction}
      </button>
    </form>
  );
}
