"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { CmsEditorialRecord, CmsEntityKind } from "@/lib/cms/editorialTypes";
import { canTransitionCmsEditorialStatus } from "@/lib/cms/editorialStatus";
import type { CmsInlineNode, CmsRichTextDocument } from "@/lib/cms/richText";

type EditorCapabilities = { canCreate: boolean; canUpdate: boolean; canReview: boolean; canSchedule: boolean; canPublish: boolean; canTrash: boolean };
type TaxonomyOptions = { categories: Array<{ id: string; name: string }>; tags: Array<{ id: string; name: string }> };

type Copy = Pick<FoundationMessages, "adminCmsEditor" | "adminCmsTitle" | "adminSlug" | "adminCmsExcerpt" | "adminCmsContent" | "adminCmsContentDirection" | "adminTemplate" | "adminSeoTitle" | "adminDefaultDescription" | "adminSaveDraft" | "adminSendReview" | "adminPublish" | "adminArchive" | "adminPreview" | "adminCmsBackToContent" | "adminSaving" | "adminSaved" | "adminValidationError" | "adminDatabaseError" | "adminConflictError" | "adminDraft" | "adminReview" | "adminPublished" | "adminCmsStatusScheduled" | "adminCmsStatusTrashed" | "adminCmsRequiresMigration" | "adminReadOnly" | "adminStatusLabel" | "adminCmsBold" | "adminCmsItalic" | "adminCmsLink" | "adminCmsEnterUrl" | "adminCmsUndo" | "adminCmsRedo" | "adminCmsAddHeading" | "adminCmsAddQuote" | "adminCmsAddList" | "adminCmsAddDivider" | "adminCmsFeaturedMedia" | "adminCmsMediaNotConfigured" | "adminCategories" | "adminCmsTags" | "adminCmsRestore" | "adminCmsSchedule" | "adminRequiresConfiguration">;

function inlineToText(nodes: CmsInlineNode[]): string {
  return nodes.map((item) => item.type === "text" ? item.text : inlineToText(item.children)).join("");
}

function textFromDocument(document: CmsRichTextDocument) {
  return document.blocks.map((block) => {
    if (block.type === "divider") return "---";
    if (block.type === "media") return `[media:${block.mediaId}]`;
    if (block.type === "ordered_list" || block.type === "unordered_list") return block.items.map((items, index) => `${block.type === "ordered_list" ? `${index + 1}. ` : "- "}${inlineToText(items)}`).join("\n");
    if (block.type === "table") return block.rows.map((row) => row.map(inlineToText).join(" | ")).join("\n");
    const text = inlineToText(block.children);
    if (block.type === "heading") return `${"#".repeat(block.level - 1)} ${text}`;
    if (block.type === "blockquote") return `> ${text}`;
    return text;
  }).join("\n\n");
}

function inlineFromMarkdown(value: string): CmsInlineNode[] {
  const nodes: CmsInlineNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g;
  let lastIndex = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push({ type: "text", text: value.slice(lastIndex, start) });
    const token = match[0];
    if (token.startsWith("**")) nodes.push({ type: "bold", children: [{ type: "text", text: token.slice(2, -2) }] });
    else if (token.startsWith("*")) nodes.push({ type: "italic", children: [{ type: "text", text: token.slice(1, -1) }] });
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) nodes.push({ type: "link", href: link[2], children: [{ type: "text", text: link[1] }] });
      else nodes.push({ type: "text", text: token });
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < value.length) nodes.push({ type: "text", text: value.slice(lastIndex) });
  return nodes;
}

function documentFromText(value: string, direction: CmsRichTextDocument["direction"]): CmsRichTextDocument {
  const chunks = value.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
  return {
    version: 1,
    direction,
    blocks: chunks.map((chunk) => {
      const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 1 && lines[0] === "---") return { type: "divider" as const };
      if (lines.every((line) => line.startsWith("- "))) return { type: "unordered_list" as const, items: lines.map((line) => inlineFromMarkdown(line.slice(2))) };
      if (lines.every((line) => /^\d+\. /.test(line))) return { type: "ordered_list" as const, items: lines.map((line) => inlineFromMarkdown(line.replace(/^\d+\. /, ""))) };
      if (lines[0]?.startsWith("> ")) return { type: "blockquote" as const, children: inlineFromMarkdown(lines.map((line) => line.replace(/^> /, "")).join(" ")) };
      if (lines[0]?.startsWith("## ")) return { type: "heading" as const, level: 2 as const, children: inlineFromMarkdown(lines[0].slice(3)) };
      if (lines[0]?.startsWith("### ")) return { type: "heading" as const, level: 3 as const, children: inlineFromMarkdown(lines[0].slice(4)) };
      if (lines[0]?.startsWith("#### ")) return { type: "heading" as const, level: 4 as const, children: inlineFromMarkdown(lines[0].slice(5)) };
      return { type: "paragraph" as const, children: inlineFromMarkdown(lines.join(" ")) };
    }),
  };
}

function recordState(record: CmsEditorialRecord | null) {
  return {
    title: record?.title ?? "",
    slug: record?.slug ?? "",
    excerpt: record?.excerpt ?? "",
    content: record ? textFromDocument(record.content) : "",
    direction: record?.content.direction ?? "auto" as const,
    template: record?.template ?? "single-page",
    seoTitle: record?.seoTitle ?? "",
    seoDescription: record?.seoDescription ?? "",
    version: record?.version ?? 0,
    categoryIds: record?.categoryIds ?? [],
    tagIds: record?.tagIds ?? [],
  };
}

function localizedStatus(status: CmsEditorialRecord["status"] | undefined, copy: Copy) {
  if (status === "review") return copy.adminReview;
  if (status === "published") return copy.adminPublished;
  if (status === "scheduled") return copy.adminCmsStatusScheduled;
  if (status === "trashed") return copy.adminCmsStatusTrashed;
  return copy.adminDraft;
}

export function CmsEditorialEditor({ kind, initialRecord, copy, migrationRequired = false, capabilities, taxonomy }: { kind: CmsEntityKind; initialRecord: CmsEditorialRecord | null; copy: Copy; migrationRequired?: boolean; capabilities: EditorCapabilities; taxonomy?: TaxonomyOptions }) {
  const [record, setRecord] = useState(initialRecord);
  const [form, setForm] = useState(recordState(initialRecord));
  const [pastContent, setPastContent] = useState<string[]>([]);
  const [futureContent, setFutureContent] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const basePath = `/admin/content/${kind === "page" ? "pages" : "posts"}`;

  function updateContent(content: string) {
    setPastContent((current) => [...current.slice(-19), form.content]);
    setFutureContent([]);
    setForm((current) => ({ ...current, content }));
  }

  function replaceSelection(prefix: string, suffix = prefix) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end) || copy.adminCmsContent;
    const next = `${form.content.slice(0, start)}${prefix}${selected}${suffix}${form.content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function insertLink() {
    const url = window.prompt(copy.adminCmsEnterUrl, "https://");
    if (url) replaceSelection("[", `](${url})`);
  }

  function appendBlock(value: string) {
    updateContent(`${form.content}${form.content ? "\n\n" : ""}${value}`);
    requestAnimationFrame(() => contentRef.current?.focus());
  }

  function undo() {
    const previous = pastContent.at(-1);
    if (previous === undefined) return;
    setPastContent((current) => current.slice(0, -1));
    setFutureContent((current) => [...current, form.content]);
    setForm((current) => ({ ...current, content: previous }));
  }

  function redo() {
    const next = futureContent.at(-1);
    if (next === undefined) return;
    setFutureContent((current) => current.slice(0, -1));
    setPastContent((current) => [...current, form.content]);
    setForm((current) => ({ ...current, content: next }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { title: form.title, slug: form.slug, excerpt: form.excerpt, content: documentFromText(form.content, form.direction), template: form.template, seoTitle: form.seoTitle, seoDescription: form.seoDescription, canonicalUrl: null, ...(kind === "post" ? { categoryIds: form.categoryIds, tagIds: form.tagIds } : {}), ...(record ? { expectedVersion: form.version } : {}) };
      const response = await fetch(record ? `${basePath}/${record.id}` : basePath, { method: record ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 409 ? copy.adminConflictError : response.status === 503 ? copy.adminCmsRequiresMigration : copy.adminValidationError);
      setRecord(body.record);
      setForm(recordState(body.record));
      setMessage(copy.adminSaved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.adminDatabaseError);
    } finally {
      setSaving(false);
    }
  }

  async function transition(status: "review" | "scheduled" | "published" | "trashed" | "draft") {
    if (!record) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${basePath}/${record.id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, expectedVersion: record.version }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 409 ? copy.adminConflictError : response.status === 503 ? copy.adminCmsRequiresMigration : copy.adminValidationError);
      setRecord(body.record);
      setForm(recordState(body.record));
      setMessage(copy.adminSaved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.adminDatabaseError);
    } finally {
      setSaving(false);
    }
  }

  return <div className="cms-editor-layout"><form className="admin-form cms-editor-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    {migrationRequired && <div className="admin-alert" role="status">{copy.adminCmsRequiresMigration}</div>}
    {message && <div className="admin-success" role="status">{message}</div>}
    {!capabilities.canCreate && !record ? <div className="admin-alert" role="status">{copy.adminReadOnly}</div> : null}
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <div className="cms-editor-topbar"><span>{record ? record.title : copy.adminCmsEditor}</span><div className="admin-form-actions">{(record ? capabilities.canUpdate : capabilities.canCreate) ? <button className="button button-primary" type="submit" disabled={saving || migrationRequired}>{saving ? copy.adminSaving : copy.adminSaveDraft}</button> : null}{record && <Link className="button" href={`${basePath}/${record.id}/preview`}>{copy.adminPreview}</Link>}</div></div>
    <div className="cms-editor-main-column">
      <label><span>{copy.adminCmsTitle}</span><input value={form.title} disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={300} required /></label>
      <label><span>{copy.adminSlug}</span><input value={form.slug} disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onChange={(event) => setForm({ ...form, slug: event.target.value })} maxLength={160} required dir="ltr" /></label>
      <div className="cms-editor-toolbar" role="toolbar" aria-label={copy.adminCmsEditor}><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => replaceSelection("**")} aria-label={copy.adminCmsBold}><strong>B</strong></button><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => replaceSelection("*")} aria-label={copy.adminCmsItalic}><em>I</em></button><button type="button" className="button button-quiet" onClick={insertLink} aria-label={copy.adminCmsLink}>{copy.adminCmsLink}</button><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => appendBlock("## ")} aria-label={copy.adminCmsAddHeading}>H</button><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => appendBlock("> ")} aria-label={copy.adminCmsAddQuote}>❯</button><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => appendBlock("- ")} aria-label={copy.adminCmsAddList}>☷</button><button type="button" className="button button-quiet" disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onClick={() => appendBlock("---")} aria-label={copy.adminCmsAddDivider}>―</button><span className="cms-toolbar-spacer" /><button type="button" className="button button-quiet" disabled={pastContent.length === 0} onClick={undo} aria-label={copy.adminCmsUndo}>↶</button><button type="button" className="button button-quiet" disabled={futureContent.length === 0} onClick={redo} aria-label={copy.adminCmsRedo}>↷</button></div>
      <label className="admin-form-full"><span>{copy.adminCmsContent}</span><textarea ref={contentRef} value={form.content} disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onChange={(event) => updateContent(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") { event.preventDefault(); replaceSelection("**"); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") { event.preventDefault(); replaceSelection("*"); } }} maxLength={100000} rows={18} dir={form.direction === "auto" ? undefined : form.direction} /></label>
      <label className="admin-form-full"><span>{copy.adminCmsExcerpt}</span><textarea disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} maxLength={2000} rows={3} /></label>
    </div>
    <div className="admin-form-actions"><label><span>{copy.adminCmsContentDirection}</span><select disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as CmsRichTextDocument["direction"] })}><option value="auto">auto</option><option value="rtl">rtl</option><option value="ltr">ltr</option></select></label><label><span>{copy.adminTemplate}</span><input disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })} maxLength={100} required /></label></div>
    {kind === "post" && <div className="cms-taxonomy-grid"><fieldset><legend>{copy.adminCategories}</legend>{taxonomy?.categories.length ? taxonomy.categories.slice(0, 50).map((item) => <label key={item.id} className="cms-check-option"><input type="checkbox" checked={form.categoryIds.includes(item.id)} disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onChange={(event) => setForm({ ...form, categoryIds: event.target.checked ? [...form.categoryIds, item.id] : form.categoryIds.filter((id) => id !== item.id) })} />{item.name}</label>) : <p className="admin-muted">{copy.adminRequiresConfiguration}</p>}</fieldset><fieldset><legend>{copy.adminCmsTags}</legend>{taxonomy?.tags.length ? taxonomy.tags.slice(0, 50).map((item) => <label key={item.id} className="cms-check-option"><input type="checkbox" checked={form.tagIds.includes(item.id)} disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} onChange={(event) => setForm({ ...form, tagIds: event.target.checked ? [...form.tagIds, item.id] : form.tagIds.filter((id) => id !== item.id) })} />{item.name}</label>) : <p className="admin-muted">{copy.adminRequiresConfiguration}</p>}</fieldset></div>}
    <div className="admin-form-grid"><label><span>{copy.adminSeoTitle}</span><input disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} maxLength={300} /></label><label><span>{copy.adminDefaultDescription}</span><textarea disabled={!(record ? capabilities.canUpdate : capabilities.canCreate)} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} maxLength={2000} rows={3} /></label></div>
    <div className="admin-form-actions">{record && <>{capabilities.canReview && canTransitionCmsEditorialStatus(record.status, "review") && <button className="button" type="button" disabled={saving || migrationRequired} onClick={() => void transition("review")}>{copy.adminSendReview}</button>}{capabilities.canSchedule && canTransitionCmsEditorialStatus(record.status, "scheduled") && <button className="button" type="button" disabled={saving || migrationRequired} onClick={() => void transition("scheduled")}>{copy.adminCmsSchedule}</button>}{capabilities.canPublish && canTransitionCmsEditorialStatus(record.status, "published") && <button className="button" type="button" disabled={saving || migrationRequired} onClick={() => void transition("published")}>{copy.adminPublish}</button>}{capabilities.canTrash && canTransitionCmsEditorialStatus(record.status, "trashed") && <button className="button button-danger" type="button" disabled={saving || migrationRequired} onClick={() => void transition("trashed")}>{copy.adminArchive}</button>}{capabilities.canUpdate && record.status === "trashed" && canTransitionCmsEditorialStatus(record.status, "draft") && <button className="button" type="button" disabled={saving || migrationRequired} onClick={() => void transition("draft")}>{copy.adminCmsRestore}</button>}</>}<Link className="button" href={basePath}>{copy.adminCmsBackToContent}</Link></div>
  </form>
  <aside className="cms-editor-sidebar" aria-label={copy.adminCmsEditor}><section className="cms-editor-panel"><h2>{copy.adminStatusLabel}</h2><p><strong>{localizedStatus(record?.status, copy)}</strong></p></section><section className="cms-editor-panel"><h2>{copy.adminCmsFeaturedMedia}</h2><p className="admin-muted">{copy.adminCmsMediaNotConfigured}</p></section><section className="cms-editor-panel"><h2>{copy.adminTemplate}</h2><p dir="ltr">{form.template}</p></section><section className="cms-editor-panel"><h2>{copy.adminSaved}</h2><p className="admin-muted">{record ? `v${record.version}` : copy.adminRequiresConfiguration}</p></section></aside></div>;
}
