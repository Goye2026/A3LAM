"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/domain/a3lam";
import type { ProfileRecord } from "@/lib/user/profileRepository";

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

export function ProfileEditor({ profile, categories }: { profile: ProfileRecord | null; categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(profile));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) { setForm((current) => ({ ...current, [field]: value })); }
  async function save(action: "save" | "submit") {
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/account/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, profile: form }) });
    const data = await response.json() as { message?: string; issues?: string[] };
    if (!response.ok) setError(data.issues?.join(" • ") || data.message || "تعذر حفظ الملف");
    else { setNotice(action === "submit" ? "تم إرسال الملف للمراجعة التحريرية." : "تم حفظ المسودة."); router.refresh(); }
    setBusy(false);
  }

  return (
    <div className="profile-editor" dir="rtl">
      <div className="editor-toolbar">
        <div><p className="eyebrow">ملف مهني</p><h1>{profile ? "تعديل ملفك" : "إنشاء ملفك المهني"}</h1><p className="route-description">احفظ عملك كمسودة في أي وقت. لا يظهر الملف للعامة قبل المراجعة والموافقة.</p></div>
        <div className="editor-actions"><button className="button button-quiet" onClick={() => router.push("/account")}>العودة</button>{profile ? <button className="button button-quiet" onClick={() => router.push("/account/profile/preview")}>معاينة خاصة</button> : null}<button className="button button-primary" onClick={() => void save("save")} disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ المسودة"}</button><button className="button button-dark" onClick={() => void save("submit")} disabled={busy}>إرسال للمراجعة</button></div>
      </div>
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
        {form.socialLinks.map((item, index) => <div className="repeat-card" key={item.id ?? index}><div className="form-grid"><label><span>المنصة</span><select value={item.platform} onChange={(e) => setField("socialLinks", updateAt(form.socialLinks, index, { platform: e.target.value }))}><option value="website">الموقع</option><option value="linkedin">LinkedIn</option><option value="x">X</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="github">GitHub</option><option value="youtube">YouTube</option></select></label><label><span>الرابط</span><input value={item.url} onChange={(e) => setField("socialLinks", updateAt(form.socialLinks, index, { url: e.target.value }))} type="url" dir="ltr" /></label></div><button type="button" className="link-button danger" onClick={() => setField("socialLinks", removeAt(form.socialLinks, index))}>حذف الرابط</button></div>)}
      </RepeatSection>

      <section className="editor-section"><h2>بيانات الاتصال</h2><p className="section-help">تُحفظ هذه البيانات بشكل خاص افتراضيًا ولا تُعرض إلا عند تفعيل الظهور صراحة.</p><div className="form-grid"><label><span>البريد المهني</span><input value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} type="email" dir="ltr" /></label><label><span>الهاتف المهني</span><input value={form.phone} onChange={(e) => setField("phone", e.target.value)} type="tel" dir="ltr" /></label><label className="checkbox-label"><input checked={form.emailPublic} onChange={(e) => setField("emailPublic", e.target.checked)} type="checkbox" /><span>إظهار البريد في الملف العام</span></label><label className="checkbox-label"><input checked={form.phonePublic} onChange={(e) => setField("phonePublic", e.target.checked)} type="checkbox" /><span>إظهار الهاتف في الملف العام</span></label></div></section>
      <div className="editor-footer-actions"><button className="button button-primary" onClick={() => void save("save")} disabled={busy}>حفظ المسودة</button><button className="button button-dark" onClick={() => void save("submit")} disabled={busy}>إرسال للمراجعة</button></div>
    </div>
  );
}

function RepeatSection({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="editor-section"><div className="section-heading-row"><div><h2>{title}</h2></div><button type="button" className="button button-quiet" onClick={onAdd}>{addLabel}</button></div>{children}</section>;
}
