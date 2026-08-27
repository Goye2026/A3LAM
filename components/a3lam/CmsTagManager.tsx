"use client";

import { useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsTagRecord } from "@/lib/cms/editorialTypes";

type Copy = Pick<FoundationMessages, "adminCmsTagName" | "adminCmsTagSlug" | "adminCmsCreateTag" | "adminCmsUpdateTag" | "adminEdit" | "adminSave" | "adminSaving" | "adminSaved" | "adminValidationError" | "adminDatabaseError" | "adminCmsRequiresMigration" | "adminCmsNoItems">;

export function CmsTagManager({ initialTags, copy }: { initialTags: CmsTagRecord[]; copy: Copy }) {
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(tag: CmsTagRecord) {
    setEditingId(tag.id);
    setName(tag.name);
    setSlug(tag.slug);
    setMessage("");
    setError("");
  }

  function reset() {
    setEditingId(null);
    setName("");
    setSlug("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(editingId ? `/api/admin/cms/tags/${editingId}` : "/api/admin/cms/tags", { method: editingId ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, slug }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 503 ? copy.adminCmsRequiresMigration : copy.adminValidationError);
      const tag = body.tag as CmsTagRecord;
      setTags((current) => editingId ? current.map((item) => item.id === tag.id ? tag : item) : [...current, tag]);
      setMessage(copy.adminSaved);
      reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.adminDatabaseError);
    } finally {
      setSaving(false);
    }
  }

  return <div className="cms-tags-manager"><form className="admin-form" onSubmit={submit}><div className="admin-form-grid"><label><span>{copy.adminCmsTagName}</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required /></label><label><span>{copy.adminCmsTagSlug}</span><input value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={160} required dir="ltr" /></label></div><div className="admin-form-actions"><button className="button button-primary" disabled={saving} type="submit">{saving ? copy.adminSaving : editingId ? copy.adminCmsUpdateTag : copy.adminCmsCreateTag}</button>{editingId && <button className="button" type="button" onClick={reset}>{copy.adminEdit}</button>}</div>{message && <p className="admin-success" role="status">{message}</p>}{error && <p className="admin-alert" role="alert">{error}</p>}</form><section className="admin-panel"><h2>{copy.adminCmsTagName}</h2>{tags.length === 0 ? <p className="admin-empty">{copy.adminCmsNoItems}</p> : <ul className="admin-simple-list">{tags.map((tag) => <li key={tag.id}><span><strong>{tag.name}</strong> <small dir="ltr">/{tag.slug}</small></span><button className="button button-quiet" type="button" onClick={() => startEdit(tag)}>{copy.adminEdit}</button></li>)}</ul>}</section></div>;
}
