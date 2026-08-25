"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthCopy = {
  name: string;
  email: string;
  password: string;
  confirmation: string;
  submit: string;
  submitting: string;
  switchPrompt: string;
  switchLabel: string;
  invalid: string;
};

type UserAuthFormProps = {
  mode: "register" | "login";
  copy: AuthCopy;
  redirectTo: string;
};

export function UserAuthForm({ mode, copy, redirectTo }: UserAuthFormProps) {
  const switchPath = mode === "register" ? "/login" : "/register";
  const switchHref = redirectTo === "/account"
    ? switchPath
    : `${switchPath}?next=${encodeURIComponent(redirectTo)}`;
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = mode === "register"
        ? { name, email, password, passwordConfirmation: confirmation }
        : { email, password };
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || copy.invalid);
      router.push(redirectTo);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.invalid);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="user-auth-form" onSubmit={handleSubmit} noValidate>
      {mode === "register" ? (
        <label>
          <span>{copy.name}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        </label>
      ) : null}
      <label>
        <span>{copy.email}</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
      </label>
      <label>
        <span>{copy.password}</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required />
      </label>
      {mode === "register" ? (
        <label>
          <span>{copy.confirmation}</span>
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" autoComplete="new-password" required />
        </label>
      ) : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? copy.submitting : copy.submit}
      </button>
      <p className="form-switch">
        {copy.switchPrompt} <Link href={switchHref}>{copy.switchLabel}</Link>
      </p>
    </form>
  );
}
