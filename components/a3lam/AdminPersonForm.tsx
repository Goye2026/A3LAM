"use client";

/* External provider URLs are validated server-side and sanitized again before this admin preview. */
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, ContentStatus, PersonRecord, SourceType } from "@/lib/domain/a3lam";
import type { AdminPersonInput } from "@/lib/admin/types";
import type { MediaAsset } from "@/lib/media/types";
import { getSafePublicImageUrl } from "@/lib/media/public";
import type { FoundationMessages } from "@/lib/i18n/messages";

type FormState = AdminPersonInput;
type MediaStatus = "ready" | "requires_configuration";

const sourceTypes: SourceType[] = ["official", "institution", "government", "media", "professional", "academic", "secondary"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `editor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankForm(): FormState {
  return { name: "", nameArabic: "", slug: "", shortBio: "", biography: "", birthDate: "", deathDate: "", birthPlace: "", deathPlace: "", image: "", status: "draft", categoryIds: [], occupations: [], sources: [], timeline: [], education: [] };
}

function getReadiness(form: FormState, categories: Category[]) {
  const selectedCategories = categories.filter((category) => form.categoryIds.includes(category.id));
  const categoriesExist = form.categoryIds.length > 0 && selectedCategories.length === form.categoryIds.length;
  const publishedCategories = categoriesExist && selectedCategories.every((category) => category.status === "published");
  const items = [
    { key: "identity", label: "identity", ready: Boolean(form.nameArabic.trim() && form.name.trim()) },
    { key: "slug", label: "slug", ready: SLUG_PATTERN.test(form.slug.trim()) },
    { key: "categories", label: "categories", ready: categoriesExist },
    { key: "biography", label: "biography", ready: Boolean(form.shortBio.trim() && form.biography.trim()) },
    { key: "source", label: "source", ready: form.sources.some((source) => Boolean(source.title.trim() && source.publisher.trim() && source.url.trim() && source.accessedAt.trim())) },
  ] as const;
  const reviewReady = items.every((item) => item.ready);
  const publishReady = reviewReady && publishedCategories;
  return { items, reviewReady, publishReady, publishedCategories };
}

function fromRecord(record: PersonRecord): FormState {
  return {
    name: record.person.name,
    nameArabic: record.person.nameArabic,
    slug: record.person.slug,
    shortBio: record.person.shortBio,
    biography: record.person.biography,
    birthDate: record.person.birthDate ?? "",
    deathDate: record.person.deathDate ?? "",
    birthPlace: record.person.birthPlace ?? "",
    deathPlace: record.person.deathPlace ?? "",
    image: record.person.image ?? "",
    status: record.person.status,
    categoryIds: record.person.categoryIds,
    occupations: record.person.occupations,
    sources: record.sources.map((source) => ({ id: source.id, title: source.title, publisher: source.publisher, url: source.url, publicationDate: source.publicationDate ?? "", accessedAt: source.accessedAt, type: source.type, reliability: source.reliability })),
    timeline: record.timeline.map((event) => ({ id: event.id, date: event.date, title: event.title, description: event.description, sourceIds: event.sourceIds })),
    education: record.education.map((item) => ({ id: item.id, institution: item.institution, field: item.field, dateRange: item.dateRange, description: item.description, sourceIds: item.sourceIds })),
  };
}

export function AdminPersonForm({ copy, categories, record, personId, mediaStatus, mediaProviderState, currentMedia }: { copy: FoundationMessages; categories: Category[]; record?: PersonRecord; personId?: string; mediaStatus: MediaStatus; mediaProviderState: "configured" | "not_configured" | "invalid_configuration"; currentMedia?: MediaAsset | null }) {
  const [form, setForm] = useState<FormState>(() => record ? fromRecord(record) : blankForm());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(currentMedia ?? null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaFeedback, setMediaFeedback] = useState("");
  const [mediaAltText, setMediaAltText] = useState(currentMedia?.altText ?? "");
  const [mediaSource, setMediaSource] = useState(currentMedia?.sourceUrl ?? "");
  const [mediaAttribution, setMediaAttribution] = useState(currentMedia?.attribution ?? "");
  const [mediaLicense, setMediaLicense] = useState(currentMedia?.license ?? "");
  const [mediaVisibility, setMediaVisibility] = useState<"private" | "public">(currentMedia?.visibility ?? "private");
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(record ? fromRecord(record) : blankForm()));
  const router = useRouter();
  const sourceOptions = useMemo(() => form.sources.filter((source) => source.id), [form.sources]);
  const readiness = useMemo(() => getReadiness(form, categories), [form, categories]);
  const isDirty = JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = submitter?.dataset.status as ContentStatus | undefined;
    const targetStatus = requestedStatus ?? form.status;
    if (targetStatus === "review" && !readiness.reviewReady) {
      setFeedback("");
      setError(copy.adminReadinessBlocked);
      return;
    }
    if (targetStatus === "published" && !readiness.publishReady) {
      setFeedback("");
      setError(copy.adminReadinessBlocked);
      return;
    }
    const payload = { ...form, status: targetStatus };
    setBusy(true);
    setError("");
    setFeedback("");
    void (async () => {
      try {
        const response = await fetch(personId ? `/api/admin/people/${encodeURIComponent(personId)}` : "/api/admin/people", {
          method: personId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          setError(response.status === 400 ? copy.adminValidationError : response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError);
          return;
        }
        const result = await response.json() as { person?: { id: string } };
        setFeedback(copy.adminSaved);
        setForm(payload);
        setSavedSnapshot(JSON.stringify(payload));
        if (!personId && result.person?.id) router.push(`/admin/people/${encodeURIComponent(result.person.id)}`);
      } catch {
        setError(copy.adminDatabaseError);
      } finally {
        setBusy(false);
      }
    })();
  }

  function updateSource(index: number, key: string, value: string) {
    setForm((current) => ({ ...current, sources: current.sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, [key]: value } : source) }));
  }

  function updateTimeline(index: number, key: string, value: string) {
    setForm((current) => ({ ...current, timeline: current.timeline.map((event, eventIndex) => eventIndex === index ? { ...event, [key]: key === "sourceIds" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value } : event) }));
  }

  function updateEducation(index: number, key: string, value: string) {
    setForm((current) => ({ ...current, education: current.education.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === "sourceIds" ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : value } : item) }));
  }

  async function uploadPortrait(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!personId) { setMediaError(copy.adminMediaRequiresPersonId); return; }
    setMediaBusy(true); setMediaError(""); setMediaFeedback("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("personId", personId);
      body.set("altText", mediaAltText);
      body.set("sourceUrl", mediaSource);
      body.set("attribution", mediaAttribution);
      body.set("license", mediaLicense);
      body.set("visibility", mediaVisibility);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      if (!response.ok) { const payload = await response.json().catch(() => null) as { message?: string } | null; setMediaError(payload?.message || (response.status === 503 ? copy.adminMediaNoProvider : copy.adminValidationError)); return; }
      const result = await response.json() as { asset?: MediaAsset };
      if (!result.asset) { setMediaError(copy.adminDatabaseError); return; }
      setMediaAsset(result.asset); setMediaAltText(result.asset.altText); setMediaSource(result.asset.sourceUrl ?? ""); setMediaAttribution(result.asset.attribution); setMediaLicense(result.asset.license); setMediaVisibility(result.asset.visibility); update("image", result.asset.publicUrl); setMediaFeedback(copy.adminSaved);
    } catch { setMediaError(copy.adminDatabaseError); } finally { setMediaBusy(false); }
  }

  async function saveMediaMetadata() {
    if (!mediaAsset) return;
    setMediaBusy(true); setMediaError(""); setMediaFeedback("");
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(mediaAsset.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ altText: mediaAltText, sourceUrl: mediaSource, attribution: mediaAttribution, license: mediaLicense, visibility: mediaVisibility }) });
      if (!response.ok) { setMediaError(response.status === 409 ? copy.adminConflictError : copy.adminValidationError); return; }
      const result = await response.json() as { asset?: MediaAsset };
      if (result.asset) setMediaAsset(result.asset);
      setMediaFeedback(copy.adminSaved);
    } catch { setMediaError(copy.adminDatabaseError); } finally { setMediaBusy(false); }
  }

  async function detachPortrait() {
    if (!personId || !mediaAsset) return;
    setMediaBusy(true); setMediaError(""); setMediaFeedback("");
    try {
      const response = await fetch("/api/admin/media/attachments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId, mediaAssetId: mediaAsset.id, usageType: "portrait" }) });
      if (!response.ok) { setMediaError(response.status === 409 ? copy.adminConflictError : copy.adminDatabaseError); return; }
      setMediaAsset(null); update("image", ""); setMediaFeedback(copy.adminSaved);
    } catch { setMediaError(copy.adminDatabaseError); } finally { setMediaBusy(false); }
  }

  return (
    <form className="admin-editor-form" onSubmit={submit}>
      <section className="admin-form-section" aria-labelledby="admin-basic-title">
        <div className="admin-section-heading"><h2 id="admin-basic-title">{copy.adminBasicInformation}</h2><span className={`admin-status admin-status-${form.status}`}>{form.status === "draft" ? copy.adminDraft : form.status === "review" ? copy.adminReview : form.status === "published" ? copy.adminPublished : copy.adminArchived}</span></div>
        <div className="admin-form-grid">
          <label>{copy.adminArabicName}<input className="admin-input" value={form.nameArabic} onChange={(event) => update("nameArabic", event.target.value)} required /></label>
          <label>{copy.adminEnglishName}<input className="admin-input" dir="ltr" value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <label>{copy.adminSlug}<input className="admin-input" dir="ltr" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => update("slug", event.target.value)} required /></label>
          <div className="admin-form-wide admin-media-field"><div className="admin-media-field-heading"><span>{copy.adminImageUrl}</span><strong className={`admin-status admin-status-${mediaProviderState === "configured" || mediaStatus === "ready" ? "published" : "draft"}`}>{mediaProviderState === "configured" || mediaStatus === "ready" ? copy.adminAvailable : copy.adminRequiresConfiguration}</strong></div><input className="admin-input" dir="ltr" type="url" value={form.image} onChange={(event) => update("image", event.target.value)} /><span className="admin-field-hint">{copy.adminImageUrlHint}</span><span className="admin-field-hint">{copy.adminMediaSafetyNote}</span>{getSafePublicImageUrl(mediaAsset?.publicUrl ?? form.image) ? <div className="admin-media-preview"><img src={getSafePublicImageUrl(mediaAsset?.publicUrl ?? form.image) ?? undefined} alt={mediaAsset?.altText || form.nameArabic || copy.adminMediaCurrentPortrait} width={160} height={160} loading="lazy" /><div><strong>{copy.adminMediaCurrentPortrait}</strong>{mediaAsset ? <span className="admin-field-hint">{mediaAsset.originalName} · {mediaAsset.width && mediaAsset.height ? `${mediaAsset.width}×${mediaAsset.height}` : "—"}</span> : null}</div></div> : null}<div className="admin-form-grid admin-media-metadata"><label>{copy.adminMediaAltText}<input className="admin-input" value={mediaAltText} onChange={(event) => setMediaAltText(event.target.value)} /></label><label>{copy.adminMediaSource}<input className="admin-input" dir="ltr" type="url" value={mediaSource} onChange={(event) => setMediaSource(event.target.value)} /></label><label>{copy.adminMediaAttribution}<input className="admin-input" value={mediaAttribution} onChange={(event) => setMediaAttribution(event.target.value)} /></label><label>{copy.adminMediaLicense}<input className="admin-input" value={mediaLicense} onChange={(event) => setMediaLicense(event.target.value)} /></label><label className="admin-check"><input type="checkbox" checked={mediaVisibility === "public"} onChange={(event) => setMediaVisibility(event.target.checked ? "public" : "private")} /><span>{copy.adminMediaVisibility}: {mediaVisibility === "public" ? copy.adminMediaPublic : copy.adminMediaPrivate}</span></label></div><div className="admin-media-actions"><label className="button button-quiet">{copy.adminMediaUpload}<input className="admin-visually-hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPortrait} disabled={!personId || mediaBusy || mediaProviderState !== "configured"} /></label>{mediaAsset ? <><button className="button button-quiet" type="button" onClick={() => void saveMediaMetadata()} disabled={mediaBusy}>{copy.adminMediaSaveMetadata}</button><button className="button button-danger" type="button" onClick={() => void detachPortrait()} disabled={mediaBusy}>{copy.adminMediaDetach}</button></> : null}</div>{!personId ? <span className="admin-field-hint">{copy.adminMediaRequiresPersonId}</span> : mediaProviderState !== "configured" ? <span className="admin-field-hint">{copy.adminMediaNoProvider}</span> : null}{mediaError ? <span className="admin-alert" role="alert">{mediaError}</span> : mediaFeedback ? <span className="admin-form-feedback" role="status">{mediaFeedback}</span> : null}</div>
          <label className="admin-form-wide">{copy.adminShortBio}<textarea className="admin-input" rows={3} value={form.shortBio} onChange={(event) => update("shortBio", event.target.value)} /></label>
          <label className="admin-form-wide">{copy.adminBiography}<span className="admin-field-hint">{copy.adminBiography} — paragraphs, headings with `#`, lists with `-`, and `**emphasis**`.</span><textarea className="admin-input admin-biography-input" rows={14} value={form.biography} onChange={(event) => update("biography", event.target.value)} /></label>
          <label>{copy.adminBirthDate}<input className="admin-input" type="date" value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></label>
          <label>{copy.adminDeathDate}<input className="admin-input" type="date" value={form.deathDate} onChange={(event) => update("deathDate", event.target.value)} /></label>
          <label>{copy.adminBirthPlace}<input className="admin-input" value={form.birthPlace} onChange={(event) => update("birthPlace", event.target.value)} /></label>
          <label>{copy.adminDeathPlace}<input className="admin-input" value={form.deathPlace} onChange={(event) => update("deathPlace", event.target.value)} /></label>
          <label className="admin-form-wide">{copy.adminOccupations}<span className="admin-field-hint">{copy.adminOccupationsHint}</span><textarea className="admin-input" rows={3} value={form.occupations.join("\n")} onChange={(event) => update("occupations", event.target.value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))} /></label>
        </div>
      </section>

      <section className="admin-form-section admin-readiness-panel" aria-labelledby="admin-readiness-title">
        <div className="admin-section-heading"><h2 id="admin-readiness-title">{copy.adminReadinessTitle}</h2><span className={`admin-readiness-badge ${readiness.publishReady ? "is-ready" : form.status === "draft" ? "is-incomplete" : "is-blocked"}`} role="status">{form.status === "draft" ? copy.adminDraft : readiness.publishReady ? copy.adminReadinessReady : copy.adminReadinessBlockedLabel}</span></div>
        <p className="admin-field-hint">{copy.adminReadinessPublishHint}</p>
        <ul className="admin-readiness-list">
          {readiness.items.map((item) => {
            const labels = { identity: `${copy.adminArabicName} / ${copy.adminEnglishName}`, slug: copy.adminSlug, categories: copy.adminCategories, biography: `${copy.adminShortBio} / ${copy.adminBiography}`, source: copy.adminSources };
            return <li className={item.ready ? "is-ready" : "is-incomplete"} key={item.key}><span aria-hidden="true">{item.ready ? "✓" : "—"}</span><span>{labels[item.label]}</span><strong>{item.ready ? copy.adminReadinessReady : copy.adminReadinessIncomplete}</strong></li>;
          })}
        </ul>
        {form.status !== "draft" && !readiness.publishReady ? <p className="admin-alert" role="alert">{copy.adminReadinessBlocked}</p> : null}
        {readiness.reviewReady && !readiness.publishedCategories ? <p className="admin-field-hint">{copy.adminReadinessBlocked}</p> : null}
      </section>

      <section className="admin-form-section" aria-labelledby="admin-categories-title">
        <div className="admin-section-heading"><h2 id="admin-categories-title">{copy.adminCategories}</h2></div>
        {categories.length > 0 ? <div className="admin-check-grid">{categories.map((category) => <label className="admin-check" key={category.id}><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={(event) => update("categoryIds", event.target.checked ? [...form.categoryIds, category.id] : form.categoryIds.filter((id) => id !== category.id))} /><span>{category.name}</span></label>)}</div> : <p className="admin-empty">{copy.adminNoCategories} <Link href="/admin/categories">{copy.adminManageCategories}</Link></p>}
      </section>

      <section className="admin-form-section" aria-labelledby="admin-sources-title">
        <div className="admin-section-heading"><h2 id="admin-sources-title">{copy.adminSources}</h2><button className="admin-inline-button" type="button" onClick={() => setForm((current) => ({ ...current, sources: [...current.sources, { id: newId(), title: "", publisher: "", url: "", publicationDate: "", accessedAt: new Date().toISOString().slice(0, 10), type: "official", reliability: "medium" }] }))}>{copy.adminAddSource}</button></div>
        {!form.sources.length ? <p className="admin-empty">{copy.adminNoSources}</p> : form.sources.map((source, index) => <fieldset className="admin-repeat-card" key={source.id ?? index}><legend>{copy.adminSources} {index + 1}</legend><div className="admin-form-grid"><label>{copy.adminSourceTitle}<input className="admin-input" value={source.title} onChange={(event) => updateSource(index, "title", event.target.value)} required /></label><label>{copy.adminPublisher}<input className="admin-input" value={source.publisher} onChange={(event) => updateSource(index, "publisher", event.target.value)} required /></label><label className="admin-form-wide">{copy.adminSourceUrl}<input className="admin-input" dir="ltr" type="url" value={source.url} onChange={(event) => updateSource(index, "url", event.target.value)} required /></label><label>{copy.adminPublicationDate}<input className="admin-input" type="date" value={source.publicationDate} onChange={(event) => updateSource(index, "publicationDate", event.target.value)} /></label><label>{copy.adminAccessedAt}<input className="admin-input" type="date" value={source.accessedAt} onChange={(event) => updateSource(index, "accessedAt", event.target.value)} required /></label><label>{copy.adminSourceType}<select className="admin-input" value={source.type} onChange={(event) => updateSource(index, "type", event.target.value)}>{sourceTypes.map((type) => <option key={type} value={type}>{copy[`source${type[0].toUpperCase()}${type.slice(1)}` as keyof FoundationMessages]}</option>)}</select></label><label>{copy.adminReliability}<select className="admin-input" value={source.reliability} onChange={(event) => updateSource(index, "reliability", event.target.value)}><option value="high">{copy.adminReliabilityHigh}</option><option value="medium">{copy.adminReliabilityMedium}</option><option value="low">{copy.adminReliabilityLow}</option></select></label></div><button className="admin-remove-button" type="button" onClick={() => setForm((current) => ({ ...current, sources: current.sources.filter((_, sourceIndex) => sourceIndex !== index) }))}>{copy.adminRemove}</button></fieldset>)}
      </section>

      <section className="admin-form-section" aria-labelledby="admin-timeline-title">
        <div className="admin-section-heading"><h2 id="admin-timeline-title">{copy.adminTimeline}</h2><button className="admin-inline-button" type="button" onClick={() => setForm((current) => ({ ...current, timeline: [...current.timeline, { id: newId(), date: new Date().toISOString().slice(0, 10), title: "", description: "", sourceIds: [] }] }))}>{copy.adminAddEvent}</button></div>
        {!form.timeline.length ? <p className="admin-empty">{copy.adminNoTimeline}</p> : form.timeline.map((event, index) => <fieldset className="admin-repeat-card" key={event.id ?? index}><legend>{copy.adminTimeline} {index + 1}</legend><div className="admin-form-grid"><label>{copy.adminEventDate}<input className="admin-input" type="date" value={event.date} onChange={(input) => updateTimeline(index, "date", input.target.value)} required /></label><label>{copy.adminEventTitle}<input className="admin-input" value={event.title} onChange={(input) => updateTimeline(index, "title", input.target.value)} required /></label><label className="admin-form-wide">{copy.adminEventDescription}<textarea className="admin-input" rows={3} value={event.description} onChange={(input) => updateTimeline(index, "description", input.target.value)} required /></label><label className="admin-form-wide">{copy.adminSources}<span className="admin-field-hint">{sourceOptions.map((source) => source.id).join(", ") || "—"}</span><input className="admin-input" dir="ltr" value={event.sourceIds.join(", ")} onChange={(input) => updateTimeline(index, "sourceIds", input.target.value)} /></label></div><button className="admin-remove-button" type="button" onClick={() => setForm((current) => ({ ...current, timeline: current.timeline.filter((_, eventIndex) => eventIndex !== index) }))}>{copy.adminRemove}</button></fieldset>)}
      </section>

      <section className="admin-form-section" aria-labelledby="admin-education-title">
        <div className="admin-section-heading"><h2 id="admin-education-title">{copy.adminEducation}</h2><button className="admin-inline-button" type="button" onClick={() => setForm((current) => ({ ...current, education: [...current.education, { id: newId(), institution: "", field: "", dateRange: "", description: "", sourceIds: [] }] }))}>{copy.adminAddEducation}</button></div>
        {!form.education.length ? <p className="admin-empty">{copy.adminNoEducation}</p> : form.education.map((item, index) => <fieldset className="admin-repeat-card" key={item.id ?? index}><legend>{copy.adminEducation} {index + 1}</legend><div className="admin-form-grid"><label>{copy.adminInstitution}<input className="admin-input" value={item.institution} onChange={(input) => updateEducation(index, "institution", input.target.value)} required /></label><label>{copy.adminField}<input className="admin-input" value={item.field} onChange={(input) => updateEducation(index, "field", input.target.value)} required /></label><label>{copy.adminDateRange}<input className="admin-input" value={item.dateRange} onChange={(input) => updateEducation(index, "dateRange", input.target.value)} required /></label><label className="admin-form-wide">{copy.adminDescription}<textarea className="admin-input" rows={3} value={item.description} onChange={(input) => updateEducation(index, "description", input.target.value)} required /></label><label className="admin-form-wide">{copy.adminSources}<input className="admin-input" dir="ltr" value={item.sourceIds.join(", ")} onChange={(input) => updateEducation(index, "sourceIds", input.target.value)} /></label></div><button className="admin-remove-button" type="button" onClick={() => setForm((current) => ({ ...current, education: current.education.filter((_, itemIndex) => itemIndex !== index) }))}>{copy.adminRemove}</button></fieldset>)}
      </section>

      <div className="admin-form-actions">
        <button className="button button-quiet" type="submit" data-status="draft" disabled={busy}>{copy.adminSaveDraft}</button>
        <button className="button button-quiet" type="submit" data-status="review" disabled={busy}>{copy.adminSendReview}</button>
        <button className="button button-primary" type="submit" data-status="published" disabled={busy}>{copy.adminPublish}</button>
        {personId ? <button className="button button-danger" type="submit" data-status="archived" disabled={busy}>{copy.adminArchive}</button> : null}
        <span aria-live="polite" className={`admin-form-feedback${isDirty ? " is-dirty" : ""}`}>{busy ? copy.adminSaving : feedback || error || (isDirty ? copy.editorUnsaved : "")}</span>
      </div>
    </form>
  );
}
