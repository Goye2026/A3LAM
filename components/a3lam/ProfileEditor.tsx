"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/domain/a3lam";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { ProfileFile, ProfileRecord } from "@/lib/user/profileRepository";

type Experience = { id?: string; jobTitle: string; organization: string; location: string; startDate: string; endDate: string; isCurrent: boolean; description: string };
type Education = { id?: string; institution: string; degree: string; field: string; startDate: string; endDate: string; description: string };
type Certification = { id?: string; name: string; issuer: string; obtainedDate: string; verificationUrl: string };
type Language = { id?: string; language: string; proficiency: string };
type Portfolio = { id?: string; title: string; description: string; url: string; coverUrl: string; workType: string };
type Social = { id?: string; platform: string; url: string };
type FormState = {
  name: string; nameArabic: string; slug: string; professionalTitle: string; professionalSummary: string; biography: string;
  city: string; country: string; contactEmail: string; phone: string; emailPublic: boolean; phonePublic: boolean; visibility: string; imageUrl: string;
  categoryIds: string[]; source: { title: string; publisher: string; url: string; type: string };
  skills: string[]; experiences: Experience[]; educations: Education[]; certifications: Certification[]; languages: Language[]; portfolio: Portfolio[]; socialLinks: Social[];
};

const emptyState: FormState = { name: "", nameArabic: "", slug: "", professionalTitle: "", professionalSummary: "", biography: "", city: "", country: "اليمن", contactEmail: "", phone: "", emailPublic: false, phonePublic: false, visibility: "private", imageUrl: "", categoryIds: [], source: { title: "", publisher: "", url: "", type: "official" }, skills: [], experiences: [], educations: [], certifications: [], languages: [], portfolio: [], socialLinks: [] };

const editorSteps = ["المعلومات الأساسية", "النبذة والمسمى", "الخبرات", "التعليم", "المهارات", "الشهادات", "اللغات", "الأعمال والمشاريع", "الروابط المهنية", "الاتصال والخصوصية", "المصدر", "المعاينة والإرسال"];
function localCompletion(form: FormState) {
  const checks = [Boolean(form.name.trim() && form.nameArabic.trim() && form.slug.trim()), Boolean(form.professionalTitle.trim() && (form.professionalSummary.trim() || form.biography.trim())), form.experiences.length > 0, form.educations.length > 0, form.skills.length > 0, form.certifications.length > 0, form.languages.length > 0, form.portfolio.length > 0, form.socialLinks.length > 0, Boolean(form.contactEmail.trim() || form.phone.trim()), Boolean(form.source.title.trim() && form.source.url.trim())];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function initialState(profile: ProfileRecord | null): FormState {
  if (!profile) return emptyState;
  const item = profile.profile;
  return {
    name: item.name, nameArabic: item.nameArabic, slug: item.slug, professionalTitle: item.professionalTitle, professionalSummary: item.professionalSummary, biography: item.biography,
    city: item.city ?? "", country: item.country ?? "", contactEmail: item.contactEmail ?? "", phone: item.phone ?? "", emailPublic: item.emailPublic, phonePublic: item.phonePublic, visibility: item.visibility, imageUrl: item.imageUrl ?? "",
    categoryIds: profile.categories.map((category) => category.id), source: profile.source ? { title: profile.source.title, publisher: profile.source.publisher, url: profile.source.url, type: profile.source.type } : emptyState.source,
    skills: profile.skills, experiences: profile.experiences.map((row) => ({ ...row, startDate: row.startDate ?? "", endDate: row.endDate ?? "" })),
    educations: profile.educations.map((row) => ({ ...row, startDate: row.startDate ?? "", endDate: row.endDate ?? "" })),
    certifications: profile.certifications.map((row) => ({ ...row, obtainedDate: row.obtainedDate ?? "", verificationUrl: row.verificationUrl ?? "" })),
    languages: profile.languages, portfolio: profile.portfolio.map((row) => ({ ...row, url: row.url ?? "", coverUrl: row.coverUrl ?? "" })), socialLinks: profile.socialLinks,
  };
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>) { return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item); }
function removeAt<T>(items: T[], index: number) { return items.filter((_, itemIndex) => itemIndex !== index); }
function moveAt<T>(items: T[], index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= items.length) return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; }

export function ProfileEditor({ profile, categories, copy }: { profile: ProfileRecord | null; categories: Category[]; copy: FoundationMessages }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(profile));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ProfileFile[]>(profile?.files ?? []);
  const [fileType, setFileType] = useState<"portrait" | "cv" | "document">("cv");
  const [filePublic, setFilePublic] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const completion = localCompletion(form);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsDirty(true);
  }
  async function save(action: "save" | "submit") {
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/account/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, profile: form }) });
    const data = await response.json() as { message?: string; issues?: string[] };
    if (!response.ok) setError(data.issues?.join(" • ") || data.message || "تعذر حفظ الملف");
    else {
      setNotice(action === "submit" ? "تم إرسال الملف للمراجعة التحريرية." : copy.editorSaved);
      setIsDirty(false);
      setLastSavedAt(new Date());
      router.refresh();
    }
    setBusy(false);
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!profile) { setFileError("احفظ المسودة أولًا قبل رفع الملفات."); return; }
    setFileBusy(true); setFileError("");
    const payload = new FormData();
    payload.set("file", file);
    payload.set("fileType", fileType);
    payload.set("isPublic", String(filePublic));
    try {
      const response = await fetch("/api/account/profile/files", { method: "POST", body: payload });
      const data = await response.json() as { file?: ProfileFile; message?: string };
      if (!response.ok || !data.file) setFileError(data.message || "تعذر رفع الملف");
      else { setAttachedFiles((current) => [...current, data.file!]); if (fileType === "portrait") setField("imageUrl", data.file.url); }
    } catch { setFileError("تعذر الاتصال بخدمة التخزين"); }
    setFileBusy(false);
  }

  return (
    <div className="profile-editor" dir="rtl">
      <div className="editor-toolbar">
        <div><p className="eyebrow">ملف مهني</p><h1>{profile ? "تعديل ملفك" : "إنشاء ملفك المهني"}</h1><p className="route-description">احفظ عملك كمسودة في أي وقت. لا يظهر الملف للعامة قبل المراجعة والموافقة.</p></div>
        <div className="editor-actions"><button className="button button-quiet" onClick={() => router.push("/account")}>العودة</button>{profile ? <button className="button button-quiet" onClick={() => router.push("/account/profile/preview")}>معاينة خاصة</button> : null}<button className="button button-primary" onClick={() => void save("save")} disabled={busy}>{busy ? copy.editorSaving : copy.adminSaveDraft}</button><button className="button button-dark" onClick={() => void save("submit")} disabled={busy}>{copy.adminSendReview}</button></div>
      </div>
      <div className={`editor-save-state${isDirty ? " is-dirty" : ""}`} role="status" aria-live="polite"><span className="save-state-dot" aria-hidden="true" />{busy ? copy.editorSaving : isDirty ? copy.editorUnsaved : lastSavedAt ? `${copy.editorSaved} · ${new Intl.DateTimeFormat("ar", { timeStyle: "short" }).format(lastSavedAt)}` : copy.editorSaveHint}</div>
      <nav className="editor-progress" aria-label="مراحل إنشاء الملف"><div className="editor-progress-heading"><span className="eyebrow">مسار الإنشاء</span><strong>{completion}% مكتمل إرشاديًا</strong></div><ol>{editorSteps.map((step, index) => <li className={index < Math.round((completion / 100) * 11) ? "is-complete" : ""} key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol><div className="completion-track" role="progressbar" aria-label="اكتمال الملف" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${completion}%` }} /></div></nav>
      <section className="editor-live-preview" aria-labelledby="live-preview-title"><div><p className="eyebrow">معاينة مباشرة</p><h2 id="live-preview-title">{form.nameArabic || "اسمك المهني"}</h2><p className="profile-latin-name">{form.name || "الاسم اللاتيني"}</p><p className="profile-role">{form.professionalTitle || "المسمى المهني"}</p>{form.city || form.country ? <p className="profile-meta">{[form.city, form.country].filter(Boolean).join("، ")}</p> : null}</div><div><span className="status-badge status-draft">{form.visibility === "published" ? "عام بعد المراجعة" : form.visibility === "unlisted" ? "غير مدرج بعد المراجعة" : "مسودة خاصة"}</span>{form.skills.length > 0 ? <div className="skill-list">{form.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div> : <p className="section-help">أضف مهارات لتظهر هنا في شكلها العام.</p>}</div></section>
      {notice ? <p className="form-success" role="status">{notice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <section className="editor-section"><h2>المعلومات الأساسية</h2><div className="form-grid">
        <label><span>الاسم العربي *</span><input value={form.nameArabic} onChange={(e) => setField("nameArabic", e.target.value)} required /></label>
        <label><span>الاسم اللاتيني *</span><input value={form.name} onChange={(e) => setField("name", e.target.value)} required /></label>
        <label><span>الرابط المختصر *</span><input value={form.slug} onChange={(e) => setField("slug", e.target.value.toLowerCase())} placeholder="your-name" dir="ltr" required /><small>أحرف لاتينية صغيرة وأرقام وشرطات فقط.</small></label>
        <label><span>المسمى المهني</span><input value={form.professionalTitle} onChange={(e) => setField("professionalTitle", e.target.value)} /></label>
        <label><span>المدينة</span><input value={form.city} onChange={(e) => setField("city", e.target.value)} /></label>
        <label><span>الدولة</span><input value={form.country} onChange={(e) => setField("country", e.target.value)} /></label>
        <label className="field-wide"><span>النبذة المهنية</span><textarea value={form.professionalSummary} onChange={(e) => setField("professionalSummary", e.target.value)} rows={4} /></label>
        <label className="field-wide"><span>السيرة المنظمة</span><textarea value={form.biography} onChange={(e) => setField("biography", e.target.value)} rows={8} /></label>
        <label className="field-wide"><span>رابط الصورة إن كانت مستضافة في مصدر آمن</span><input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} type="url" dir="ltr" placeholder="https://" /></label>
      </div></section>

      <section className="editor-section"><h2>التصنيف والظهور</h2><div className="form-grid"><label><span>التصنيفات</span><select multiple value={form.categoryIds} onChange={(e) => setField("categoryIds", Array.from(e.target.selectedOptions, (option) => option.value))}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><small>استخدم Ctrl أو Command لاختيار أكثر من تصنيف.</small></label><label><span>حالة الظهور المقصودة</span><select value={form.visibility} onChange={(e) => setField("visibility", e.target.value)}><option value="private">خاص</option><option value="unlisted">غير مدرج — رابط مباشر فقط</option><option value="published">عام — بعد الموافقة</option></select></label></div></section>

      <section className="editor-section"><h2>المصدر الموثوق</h2><p className="section-help">يلزم مصدر واحد على الأقل قبل إرسال الملف للمراجعة. لا يُنشر المصدر قبل نشر الملف.</p><div className="form-grid"><label><span>عنوان المصدر</span><input value={form.source.title} onChange={(e) => setField("source", { ...form.source, title: e.target.value })} /></label><label><span>الناشر أو المؤسسة</span><input value={form.source.publisher} onChange={(e) => setField("source", { ...form.source, publisher: e.target.value })} /></label><label><span>الرابط</span><input value={form.source.url} onChange={(e) => setField("source", { ...form.source, url: e.target.value })} type="url" dir="ltr" /></label><label><span>نوع المصدر</span><select value={form.source.type} onChange={(e) => setField("source", { ...form.source, type: e.target.value })}><option value="official">رسمي</option><option value="institution">مؤسسة</option><option value="government">حكومي</option><option value="academic">أكاديمي</option><option value="professional">مهني</option><option value="media">إعلامي</option><option value="secondary">ثانوي موثوق</option></select></label></div></section>

      <section className="editor-section"><h2>المهارات</h2><label><span>المهارات مفصولة بفواصل</span><input value={form.skills.join(", ")} onChange={(e) => setField("skills", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="إدارة المشاريع، البحث، الكتابة" /></label></section>

      <RepeatSection title="الخبرات العملية" addLabel="إضافة خبرة" onAdd={() => setField("experiences", [...form.experiences, { jobTitle: "", organization: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }])}>
        {form.experiences.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>المسمى</span><input value={item.jobTitle} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { jobTitle: e.target.value }))} /></label><label><span>المؤسسة</span><input value={item.organization} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { organization: e.target.value }))} /></label><label><span>المكان</span><input value={item.location} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { location: e.target.value }))} /></label><label><span>من</span><input value={item.startDate} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { startDate: e.target.value }))} type="date" /></label><label><span>إلى</span><input value={item.endDate} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { endDate: e.target.value }))} type="date" disabled={item.isCurrent} /></label><label className="checkbox-label"><input checked={item.isCurrent} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { isCurrent: e.target.checked, endDate: "" }))} type="checkbox" /><span>أعمل هنا حاليًا</span></label><label className="field-wide"><span>الوصف</span><textarea value={item.description} onChange={(e) => setField("experiences", updateAt(form.experiences, index, { description: e.target.value }))} rows={3} /></label></div><button type="button" className="link-button danger" onClick={() => setField("experiences", removeAt(form.experiences, index))}>حذف الخبرة</button></div>)}
      </RepeatSection>

      <RepeatSection title="التعليم" addLabel="إضافة مؤهل" onAdd={() => setField("educations", [...form.educations, { institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" }])}>
        {form.educations.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>المؤسسة</span><input value={item.institution} onChange={(e) => setField("educations", updateAt(form.educations, index, { institution: e.target.value }))} /></label><label><span>الدرجة</span><input value={item.degree} onChange={(e) => setField("educations", updateAt(form.educations, index, { degree: e.target.value }))} /></label><label><span>المجال</span><input value={item.field} onChange={(e) => setField("educations", updateAt(form.educations, index, { field: e.target.value }))} /></label><label><span>من</span><input value={item.startDate} onChange={(e) => setField("educations", updateAt(form.educations, index, { startDate: e.target.value }))} type="date" /></label><label><span>إلى</span><input value={item.endDate} onChange={(e) => setField("educations", updateAt(form.educations, index, { endDate: e.target.value }))} type="date" /></label><label className="field-wide"><span>ملاحظات</span><textarea value={item.description} onChange={(e) => setField("educations", updateAt(form.educations, index, { description: e.target.value }))} rows={3} /></label></div><button type="button" className="link-button danger" onClick={() => setField("educations", removeAt(form.educations, index))}>حذف المؤهل</button></div>)}
      </RepeatSection>

      <RepeatSection title="الشهادات المهنية" addLabel="إضافة شهادة" onAdd={() => setField("certifications", [...form.certifications, { name: "", issuer: "", obtainedDate: "", verificationUrl: "" }])}>
        {form.certifications.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>اسم الشهادة</span><input value={item.name} onChange={(e) => setField("certifications", updateAt(form.certifications, index, { name: e.target.value }))} /></label><label><span>الجهة المانحة</span><input value={item.issuer} onChange={(e) => setField("certifications", updateAt(form.certifications, index, { issuer: e.target.value }))} /></label><label><span>تاريخ الحصول</span><input value={item.obtainedDate} onChange={(e) => setField("certifications", updateAt(form.certifications, index, { obtainedDate: e.target.value }))} type="date" /></label><label><span>رابط التحقق</span><input value={item.verificationUrl} onChange={(e) => setField("certifications", updateAt(form.certifications, index, { verificationUrl: e.target.value }))} type="url" dir="ltr" /></label></div><button type="button" className="link-button danger" onClick={() => setField("certifications", removeAt(form.certifications, index))}>حذف الشهادة</button></div>)}
      </RepeatSection>

      <RepeatSection title="اللغات" addLabel="إضافة لغة" onAdd={() => setField("languages", [...form.languages, { language: "", proficiency: "" }])}>
        {form.languages.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>اللغة</span><input value={item.language} onChange={(e) => setField("languages", updateAt(form.languages, index, { language: e.target.value }))} /></label><label><span>مستوى الإتقان</span><input value={item.proficiency} onChange={(e) => setField("languages", updateAt(form.languages, index, { proficiency: e.target.value }))} placeholder="أساسي، متوسط، متقدم" /></label></div><button type="button" className="link-button danger" onClick={() => setField("languages", removeAt(form.languages, index))}>حذف اللغة</button></div>)}
      </RepeatSection>

      <RepeatSection title="الأعمال والروابط" addLabel="إضافة عمل" onAdd={() => setField("portfolio", [...form.portfolio, { title: "", description: "", url: "", coverUrl: "", workType: "project" }])}>
        {form.portfolio.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>عنوان العمل</span><input value={item.title} onChange={(e) => setField("portfolio", updateAt(form.portfolio, index, { title: e.target.value }))} /></label><label><span>نوع العمل</span><select value={item.workType} onChange={(e) => setField("portfolio", updateAt(form.portfolio, index, { workType: e.target.value }))}><option value="project">مشروع</option><option value="article">مقال</option><option value="book">كتاب</option><option value="research">بحث</option><option value="website">موقع</option><option value="application">تطبيق</option><option value="video">فيديو</option><option value="product">منتج</option></select></label><label><span>الرابط</span><input value={item.url} onChange={(e) => setField("portfolio", updateAt(form.portfolio, index, { url: e.target.value }))} type="url" dir="ltr" /></label><label><span>رابط الغلاف</span><input value={item.coverUrl} onChange={(e) => setField("portfolio", updateAt(form.portfolio, index, { coverUrl: e.target.value }))} type="url" dir="ltr" /></label><label className="field-wide"><span>الوصف</span><textarea value={item.description} onChange={(e) => setField("portfolio", updateAt(form.portfolio, index, { description: e.target.value }))} rows={3} /></label></div><button type="button" className="link-button danger" onClick={() => setField("portfolio", removeAt(form.portfolio, index))}>حذف العمل</button></div>)}
      </RepeatSection>

      <RepeatSection title="الروابط الاجتماعية" addLabel="إضافة رابط" onAdd={() => setField("socialLinks", [...form.socialLinks, { platform: "website", url: "" }])}>
        {form.socialLinks.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>المنصة</span><select value={item.platform} onChange={(e) => setField("socialLinks", updateAt(form.socialLinks, index, { platform: e.target.value }))}><option value="website">الموقع</option><option value="linkedin">LinkedIn</option><option value="x">X</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="github">GitHub</option><option value="youtube">YouTube</option></select></label><label><span>الرابط</span><input value={item.url} onChange={(e) => setField("socialLinks", updateAt(form.socialLinks, index, { url: e.target.value }))} type="url" dir="ltr" /></label></div><div className="repeat-actions"><button type="button" className="link-button" disabled={index === 0} onClick={() => setField("socialLinks", moveAt(form.socialLinks, index, -1))}>↑ رفع</button><button type="button" className="link-button" disabled={index === form.socialLinks.length - 1} onClick={() => setField("socialLinks", moveAt(form.socialLinks, index, 1))}>↓ خفض</button><button type="button" className="link-button danger" onClick={() => setField("socialLinks", removeAt(form.socialLinks, index))}>حذف الرابط</button></div></div>)}
      </RepeatSection>

      <section className="editor-section" id="contact-privacy"><h2>بيانات الاتصال والخصوصية</h2><p className="section-help">تُحفظ هذه البيانات بشكل خاص افتراضيًا ولا تُعرض إلا عند تفعيل الظهور صراحة.</p><div className="form-grid"><label><span>البريد المهني</span><input value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} type="email" dir="ltr" /></label><label><span>الهاتف المهني</span><input value={form.phone} onChange={(e) => setField("phone", e.target.value)} type="tel" dir="ltr" /></label><label className="checkbox-label"><input checked={form.emailPublic} onChange={(e) => setField("emailPublic", e.target.checked)} type="checkbox" /><span>إظهار البريد في الملف العام</span></label><label className="checkbox-label"><input checked={form.phonePublic} onChange={(e) => setField("phonePublic", e.target.checked)} type="checkbox" /><span>إظهار الهاتف في الملف العام</span></label></div></section>
      <section className="editor-section" id="files"><h2>الملفات المرفقة</h2><p className="section-help">الأنواع الآمنة: PDF وJPG وJPEG وPNG وWebP. لا تُرفع الملفات قبل حفظ المسودة، ولا يوجد تخزين محلي بديل.</p><div className="file-upload-controls"><label><span>نوع الملف</span><select value={fileType} onChange={(e) => setFileType(e.target.value as "portrait" | "cv" | "document")}><option value="portrait">صورة شخصية</option><option value="cv">سيرة ذاتية</option><option value="document">مستند مهني</option></select></label><label className="checkbox-label"><input checked={filePublic} onChange={(e) => setFilePublic(e.target.checked)} type="checkbox" /><span>السماح بظهوره للعامة بعد النشر</span></label><label className="file-input-label"><span>{fileBusy ? "جارٍ الرفع…" : "اختيار ملف"}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void uploadFile(event)} disabled={fileBusy || !profile} /></label></div>{fileError ? <p className="form-error" role="alert">{fileError}</p> : null}{attachedFiles.length > 0 ? <ul className="attached-file-list">{attachedFiles.map((file) => <li key={file.id}><strong>{file.originalName}</strong><span>{file.fileType} · {file.isPublic ? "عام بعد النشر" : "خاص"}</span></li>)}</ul> : <p className="section-help">لا توجد ملفات مرفقة بعد.</p>}</section>
      <div className="editor-footer-actions"><button className="button button-primary" onClick={() => void save("save")} disabled={busy}>{busy ? copy.editorSaving : copy.adminSaveDraft}</button><button className="button button-dark" onClick={() => void save("submit")} disabled={busy}>{copy.adminSendReview}</button></div>
    </div>
  );
}

function RepeatSection({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="editor-section"><div className="section-heading-row"><div><h2>{title}</h2></div><button type="button" className="button button-quiet" onClick={onAdd}>{addLabel}</button></div>{children}</section>;
}
