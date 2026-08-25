"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/domain/a3lam";
import type { FoundationMessages } from "@/lib/i18n/messages";

type CategoryFormState = {
  name: string;
  description: string;
  slug: string;
};

function initialState(category?: Category): CategoryFormState {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    slug: category?.slug ?? "",
  };
}

export function AdminCategoryForm({ copy, category, canEdit = true }: { copy: FoundationMessages; category?: Category; canEdit?: boolean }) {
  const [form, setForm] = useState<CategoryFormState>(() => initialState(category));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialState(category)));
  const router = useRouter();
  const isEditing = Boolean(category?.id);
  const isDirty = JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  function update(field: keyof CategoryFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    setError("");
    void (async () => {
      try {
        const response = await fetch(isEditing ? `/api/admin/categories/${encodeURIComponent(category!.id)}` : "/api/admin/categories", {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          setError(response.status === 400 ? copy.adminValidationError : response.status === 409 ? copy.adminConflictError : response.status === 404 ? copy.adminNotFound : copy.adminDatabaseError);
          return;
        }
        const result = await response.json() as { category?: Category };
        setFeedback(copy.adminCategorySaved);
        setSavedSnapshot(JSON.stringify(form));
        if (!isEditing && result.category?.id) router.push(`/admin/categories?edit=${encodeURIComponent(result.category.id)}`);
        else router.refresh();
      } catch {
        setError(copy.adminDatabaseError);
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <form className="admin-editor-form admin-category-form" onSubmit={submit}>
      <div className="admin-section-heading">
        <h2>{isEditing ? copy.adminCategoryEditTitle : copy.adminCategoryCreateTitle}</h2>
        {category ? <span className={`admin-status admin-status-${category.status}`}>{category.status === "published" ? copy.adminPublished : category.status === "draft" ? copy.adminDraft : category.status === "review" ? copy.adminReview : copy.adminArchived}</span> : null}
      </div>
      <div className="admin-form-grid">
        <label>{copy.adminCategoryName}<input className="admin-input" value={form.name} onChange={(event) => update("name", event.target.value)} required maxLength={300} /></label>
        <label>{copy.adminSlug}<input className="admin-input" dir="ltr" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => update("slug", event.target.value)} required maxLength={120} /></label>
        <label className="admin-form-wide">{copy.adminCategoryDescription}<textarea className="admin-input" rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} required maxLength={5000} /></label>
      </div>
      <p className="admin-field-hint">{copy.adminCategoryPublicNote}</p>
      {canEdit ? <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? copy.adminSaving : isEditing ? copy.adminUpdateCategory : copy.adminCreateCategory}</button>
        <span aria-live="polite" className={`admin-form-feedback${isDirty ? " is-dirty" : ""}`}>{feedback || error || (isDirty ? copy.editorUnsaved : "")}</span>
      </div> : <p className="admin-readonly-note">{copy.adminReadOnly}</p>}
    </form>
  );
}
