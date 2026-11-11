"use client";

/* Hero URLs are validated by parseSiteExperienceConfig and selected from public Media Library assets. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type ChangeEvent } from "react";
import { AdminFoundationPanel } from "@/components/a3lam/AdminFoundationPanel";
import { CmsMediaPicker, type CmsMediaPickerItem } from "@/components/a3lam/CmsMediaPicker";
import type { SiteExperienceDirectoryOptions } from "@/components/a3lam/AdminSiteExperiencePage";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { AdminSiteExperienceResource } from "@/lib/site-experience/repository";
import {
  siteExperienceDefaults,
  type AppearanceSettings,
  type FooterSettings,
  type HomepageSettings,
  type NavigationSettings,
  type ProfilePresentationSettings,
  type SeoSettings,
  type SiteExperienceConfig,
  type SiteExperienceResource,
  type SiteIdentity,
  type SiteSettings,
} from "@/lib/site-experience/config";

const sectionLabels: Record<HomepageSettings["sections"][number]["key"], keyof FoundationMessages> = {
  hero: "adminHero",
  search: "adminSearchSection",
  featured: "adminFeaturedSection",
  categories: "adminCategoriesSection",
  profiles: "adminProfilesSection",
  about: "adminAboutSection",
  final_cta: "adminFinalCta",
};

type Props = {
  resource: SiteExperienceResource;
  title: string;
  copy: FoundationMessages;
  initial: AdminSiteExperienceResource | null;
  unavailable: boolean;
  canEdit: boolean;
  canPublish: boolean;
  directoryOptions: SiteExperienceDirectoryOptions;
};

function statusMessage(status: number, copy: FoundationMessages) { return status === 503 ? copy.adminRequiresSchema : status === 403 ? copy.adminUnauthorized : status === 400 ? copy.adminValidationError : copy.adminDatabaseError; }

export function AdminSiteExperienceEditor({ resource, title, copy, initial, unavailable, canEdit, canPublish, directoryOptions }: Props) {
  const [draft, setDraft] = useState<SiteExperienceConfig>(() => initial?.draft ?? siteExperienceDefaults[resource]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const published = initial?.published ?? siteExperienceDefaults[resource];
  const hasDraft = useMemo(() => JSON.stringify(draft) !== JSON.stringify(published), [draft, published]);

  function updateDraft(next: SiteExperienceConfig) {
    setDraft(next);
    setFeedback("");
    setError("");
  }

  async function saveDraft() {
    setBusy(true); setFeedback(""); setError("");
    try {
      const response = await fetch(`/api/admin/site-experience/${resource}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: draft }) });
      if (!response.ok) { setError(statusMessage(response.status, copy)); return; }
      setFeedback(copy.adminDraftSaved);
    } catch { setError(copy.adminDatabaseError); } finally { setBusy(false); }
  }

  async function publish() {
    if (!window.confirm(copy.adminPublishConfirmation)) return;
    setBusy(true); setFeedback(""); setError("");
    try {
      const response = await fetch(`/api/admin/site-experience/${resource}/publish`, { method: "POST" });
      if (!response.ok) { setError(statusMessage(response.status, copy)); return; }
      setFeedback(copy.adminPublishSuccess);
    } catch { setError(copy.adminDatabaseError); } finally { setBusy(false); }
  }

  if (unavailable) return <div className="admin-route"><AdminFoundationPanel eyebrow={copy.adminProductGroup} title={title} description={copy.adminUnavailableDescription} status={copy.adminRequiresSchema} /></div>;
  if (!initial) return <div className="admin-route"><AdminFoundationPanel eyebrow={copy.adminProductGroup} title={title} description={copy.adminUnavailableDescription} status={copy.adminDatabaseError} /></div>;

  return <div className="admin-route">
    <header className="admin-route-heading"><div><p className="eyebrow">{copy.adminProductGroup}</p><h1>{title}</h1><p className="route-description">{copy.adminSiteExperienceDescription}</p></div><div className="admin-heading-actions">{resource === "homepage" ? <a className="button button-quiet" href="/admin/homepage/preview">{copy.adminPreview}</a> : null}</div></header>
    <section className="admin-version-strip" aria-label={copy.adminSiteExperienceDescription}><div><span>{copy.adminDraftVersion}</span><strong>{hasDraft ? copy.adminDraft : copy.adminPublished}</strong></div><div><span>{copy.adminPublishedVersion}</span><strong>{initial.publishedAt ? new Date(initial.publishedAt).toLocaleString() : copy.adminNoRecent}</strong></div><div><span>{copy.adminLastSaved}</span><strong>{initial.updatedAt ? new Date(initial.updatedAt).toLocaleString() : copy.adminNoRecent}</strong></div></section>
    <form className="admin-editor-form" onSubmit={(event) => { event.preventDefault(); void saveDraft(); }}>
      {resource === "settings" ? <SettingsFields value={draft as SiteSettings} copy={copy} update={value => updateDraft(value)} /> : null}
      {resource === "identity" ? <IdentityFields value={draft as SiteIdentity} copy={copy} update={value => updateDraft(value)} /> : null}
      {resource === "appearance" ? <AppearanceFields value={draft as AppearanceSettings} copy={copy} update={value => updateDraft(value)} /> : null}
      {resource === "homepage" ? <HomepageFields value={draft as HomepageSettings} copy={copy} update={value => updateDraft(value)} directoryOptions={directoryOptions} /> : null}
      {resource === "navigation" ? <NavigationFields value={draft as NavigationSettings} copy={copy} update={value => updateDraft(value)} directoryOptions={directoryOptions} /> : null}
      {resource === "footer" ? <FooterFields value={draft as FooterSettings} copy={copy} update={value => updateDraft(value)} /> : null}
      {resource === "seo" ? <SeoFields value={draft as SeoSettings} copy={copy} update={value => updateDraft(value)} /> : null}
      {resource === "profile_presentation" ? <ProfilePresentationFields value={draft as ProfilePresentationSettings} copy={copy} update={value => updateDraft(value)} /> : null}
      <div className="admin-form-actions"><button className="button button-primary" type="submit" disabled={!canEdit || busy}>{busy ? copy.adminSaving : copy.adminSaveDraft}</button><button className="button button-quiet" type="button" disabled={!canPublish || busy || !hasDraft} onClick={() => void publish()}>{copy.adminPublishDraft}</button><span className="admin-form-feedback" role="status">{feedback || error || (!canEdit ? copy.adminReadOnly : "")}</span></div>
    </form>
  </div>;
}

function SettingsFields({ value, copy, update }: { value: SiteSettings; copy: FoundationMessages; update: (value: SiteSettings) => void }) {
  return <div className="admin-form-grid"><label>{copy.adminSiteName}<input className="admin-input" value={value.siteName} onChange={event => update({ ...value, siteName: event.target.value })} maxLength={120} required /></label><label>{copy.adminTagline}<input className="admin-input" value={value.siteTagline} onChange={event => update({ ...value, siteTagline: event.target.value })} maxLength={240} /></label><label className="admin-form-wide">{copy.adminDefaultDescription}<textarea className="admin-input" rows={4} value={value.siteDescription} onChange={event => update({ ...value, siteDescription: event.target.value })} maxLength={500} /></label><label>{copy.adminDefaultLanguage}<select className="admin-input" value={value.defaultLanguage} onChange={event => update({ ...value, defaultLanguage: event.target.value as SiteSettings["defaultLanguage"] })}><option value="ar">ar</option><option value="en">en</option></select></label><label>{copy.adminDirection}<select className="admin-input" value={value.defaultDirection} onChange={event => update({ ...value, defaultDirection: event.target.value as SiteSettings["defaultDirection"] })}><option value="rtl">rtl</option><option value="ltr">ltr</option></select></label><label>{copy.adminSupportEmail}<input className="admin-input" dir="ltr" type="email" value={value.supportEmail} onChange={event => update({ ...value, supportEmail: event.target.value })} maxLength={320} /></label><label>{copy.adminContactEmail}<input className="admin-input" dir="ltr" type="email" value={value.contactEmail} onChange={event => update({ ...value, contactEmail: event.target.value })} maxLength={320} /></label></div>;
}

function IdentityFields({ value, copy, update }: { value: SiteIdentity; copy: FoundationMessages; update: (value: SiteIdentity) => void }) {
  return <div className="admin-form-grid"><label>{copy.adminSiteName}<input className="admin-input" value={value.siteName} onChange={event => update({ ...value, siteName: event.target.value })} maxLength={120} required /></label><label>{copy.adminShortName}<input className="admin-input" dir="ltr" value={value.shortName} onChange={event => update({ ...value, shortName: event.target.value })} maxLength={60} required /></label><label>{copy.adminTagline}<input className="admin-input" value={value.tagline} onChange={event => update({ ...value, tagline: event.target.value })} maxLength={240} /></label><label>{copy.adminLogo}<input className="admin-input" dir="ltr" value={value.logoUrl} onChange={event => update({ ...value, logoUrl: event.target.value })} maxLength={1000} /></label><label>{copy.adminFavicon}<input className="admin-input" dir="ltr" value={value.faviconUrl} onChange={event => update({ ...value, faviconUrl: event.target.value })} maxLength={1000} /></label><label className="admin-form-wide">{copy.adminBrandDescription}<textarea className="admin-input" rows={4} value={value.brandDescription} onChange={event => update({ ...value, brandDescription: event.target.value })} maxLength={500} /></label></div>;
}

function AppearanceFields({ value, copy, update }: { value: AppearanceSettings; copy: FoundationMessages; update: (value: AppearanceSettings) => void }) {
  const select = (key: keyof AppearanceSettings, label: string, options: string[]) => <label>{label}<select className="admin-input" value={String(value[key])} onChange={event => update({ ...value, [key]: event.target.value } as AppearanceSettings)}>{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>;
  return <div className="admin-form-grid">{select("theme", copy.adminTheme, ["light"])}{select("typography", copy.adminTypography, ["arabic-editorial"])}{select("spacing", copy.adminSpacing, ["comfortable", "compact"])}{select("radius", copy.adminRadius, ["soft", "sharp"])}{select("navigationStyle", copy.adminNavigationStyle, ["editorial", "minimal"])}{select("cardStyle", copy.adminCardStyle, ["elevated", "outlined"])}{select("buttonStyle", copy.adminButtonStyle, ["solid", "quiet"])}{select("heroStyle", copy.adminHeroStyle, ["editorial", "compact"])}{select("footerStyle", copy.adminFooterStyle, ["editorial", "minimal"])}<fieldset className="admin-fieldset admin-form-wide"><legend>{copy.adminThemeSettings}</legend><div className="admin-form-grid">{selectToken("primary", copy.adminTokenPrimary, value.tokens.primary, ["teal", "ink"], value, update)}{selectToken("accent", copy.adminTokenAccent, value.tokens.accent, ["copper", "sand"], value, update)}{selectToken("surface", copy.adminTokenSurface, value.tokens.surface, ["paper", "mist"], value, update)}{selectToken("density", copy.adminTokenDensity, value.tokens.density, ["comfortable", "compact"], value, update)}{selectToken("container", copy.adminTokenContainer, value.tokens.container, ["wide", "standard"], value, update)}</div></fieldset></div>;
}

function selectToken(key: keyof AppearanceSettings["tokens"], label: string, current: string, options: string[], value: AppearanceSettings, update: (value: AppearanceSettings) => void) { return <label key={key}>{label}<select className="admin-input" value={current} onChange={event => update({ ...value, tokens: { ...value.tokens, [key]: event.target.value } as AppearanceSettings["tokens"] })}>{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>; }

function HomepageFields({ value, copy, update, directoryOptions }: { value: HomepageSettings; copy: FoundationMessages; update: (value: HomepageSettings) => void; directoryOptions: SiteExperienceDirectoryOptions }) {
  const [personQuery, setPersonQuery] = useState("");
  function move(index: number, direction: -1 | 1) {
    const next = [...value.sections].sort((a, b) => a.order - b.order);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ ...value, sections: next.map((item, order) => ({ ...item, order })) });
  }
  const selectedValues = (event: ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions, (option) => option.value);
  const filteredPeople = directoryOptions.people.filter((person) => `${person.nameArabic} ${person.slug}`.toLocaleLowerCase().includes(personQuery.trim().toLocaleLowerCase()));
  const updateHeroImage = (item: CmsMediaPickerItem) => update({ ...value, hero: { ...value.hero, imageUrl: item.publicUrl } });
  return <div className="admin-form-stack">
    <section className="admin-fieldset"><h2>{copy.adminHomepageBuilder}</h2><div className="admin-section-list">{[...value.sections].sort((a, b) => a.order - b.order).map((section, index) => <div className="admin-sortable-row" key={section.key}><strong>{copy[sectionLabels[section.key]]}</strong><label><input type="checkbox" checked={section.visible} onChange={event => update({ ...value, sections: value.sections.map(item => item.key === section.key ? { ...item, visible: event.target.checked } : item) })} /> {section.visible ? copy.adminVisible : copy.adminHidden}</label><div><button className="button button-quiet" type="button" onClick={() => move(index, -1)} disabled={index === 0}>{copy.adminMoveUp}</button><button className="button button-quiet" type="button" onClick={() => move(index, 1)} disabled={index === value.sections.length - 1}>{copy.adminMoveDown}</button></div></div>)}</div></section>
    <div className="admin-form-grid">
      <label>{copy.adminHero}<input className="admin-input" value={value.hero.eyebrow} onChange={event => update({ ...value, hero: { ...value.hero, eyebrow: event.target.value } })} maxLength={160} /></label>
      <label>{copy.adminSectionTitle}<input className="admin-input" value={value.hero.title} onChange={event => update({ ...value, hero: { ...value.hero, title: event.target.value } })} maxLength={220} required /></label>
      <label className="admin-form-wide">{copy.adminSubtitle}<textarea className="admin-input" rows={3} value={value.hero.subtitle} onChange={event => update({ ...value, hero: { ...value.hero, subtitle: event.target.value } })} maxLength={500} /></label>
      <div className="admin-fieldset admin-form-wide"><strong>{copy.adminMedia}</strong><p className="admin-field-hint">{value.hero.imageUrl || copy.adminMediaPrivate}</p>{value.hero.imageUrl ? <><img src={value.hero.imageUrl} alt="" width={240} height={120} className="admin-media-preview" /><button className="button button-quiet" type="button" onClick={() => update({ ...value, hero: { ...value.hero, imageUrl: "" } })}>{copy.adminRemove}</button></> : null}<CmsMediaPicker copy={copy} canSelect onSelect={updateHeroImage} /></div>
      <label>{copy.adminLabel}<input className="admin-input" value={value.hero.primary.label} onChange={event => update({ ...value, hero: { ...value.hero, primary: { ...value.hero.primary, label: event.target.value } } })} maxLength={100} required /></label>
      <label>{copy.adminUrl}<input className="admin-input" dir="ltr" value={value.hero.primary.href} onChange={event => update({ ...value, hero: { ...value.hero, primary: { ...value.hero.primary, href: event.target.value } } })} maxLength={1000} required /></label>
      <label>{copy.adminLabel}<input className="admin-input" value={value.hero.secondary.label} onChange={event => update({ ...value, hero: { ...value.hero, secondary: { ...value.hero.secondary, label: event.target.value } } })} maxLength={100} required /></label>
      <label>{copy.adminUrl}<input className="admin-input" dir="ltr" value={value.hero.secondary.href} onChange={event => update({ ...value, hero: { ...value.hero, secondary: { ...value.hero.secondary, href: event.target.value } } })} maxLength={1000} required /></label>
      <label>{copy.adminSearchSection}<input className="admin-input" value={value.search.title} onChange={event => update({ ...value, search: { ...value.search, title: event.target.value } })} maxLength={160} required /></label>
      <label>{copy.adminHelperText}<input className="admin-input" value={value.search.placeholder} onChange={event => update({ ...value, search: { ...value.search, placeholder: event.target.value } })} maxLength={180} /></label>
      <label>{copy.adminHelperText}<input className="admin-input" value={value.search.helperText} onChange={event => update({ ...value, search: { ...value.search, helperText: event.target.value } })} maxLength={300} /></label>
      <label>{copy.adminFeaturedSection}<input className="admin-input" value={value.featured.sectionTitle} onChange={event => update({ ...value, featured: { ...value.featured, sectionTitle: event.target.value } })} maxLength={160} required /></label>
      <label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={3} value={value.featured.sectionDescription} onChange={event => update({ ...value, featured: { ...value.featured, sectionDescription: event.target.value } })} maxLength={400} /></label>
      <label>{copy.adminSelectionMode}<select className="admin-input" value={value.featured.selectionMode} onChange={event => update({ ...value, featured: { ...value.featured, selectionMode: event.target.value as HomepageSettings["featured"]["selectionMode"] } })}><option value="latest">latest</option><option value="selected">selected</option></select></label>
      <label className="admin-form-wide">{copy.adminCategories}<select className="admin-input" multiple size={Math.min(Math.max(directoryOptions.categories.length, 3), 8)} value={value.featured.selectedCategoryIds} onChange={event => update({ ...value, featured: { ...value.featured, selectedCategoryIds: selectedValues(event) } })}>{directoryOptions.categories.map(category => <option key={category.id} value={category.id}>{category.name} · /{category.slug}</option>)}</select><small className="admin-field-hint">{copy.adminHelperText}</small></label>
      <label className="admin-form-wide">{copy.adminPeople}<input className="admin-input" value={personQuery} onChange={event => setPersonQuery(event.target.value)} placeholder={copy.adminSearch} /><select className="admin-input" multiple size={Math.min(Math.max(filteredPeople.length, 3), 8)} value={value.featured.selectedPersonIds} onChange={event => update({ ...value, featured: { ...value.featured, selectedPersonIds: selectedValues(event) } })}>{filteredPeople.map(person => <option key={person.id} value={person.id}>{person.nameArabic} · /{person.slug}</option>)}</select><small className="admin-field-hint">{copy.adminHelperText}</small></label>
      <label>{copy.adminProfilesSection}<input className="admin-input" value={value.profiles.title} onChange={event => update({ ...value, profiles: { ...value.profiles, title: event.target.value } })} maxLength={160} required /></label>
      <label><input type="checkbox" checked={value.profiles.visible} onChange={event => update({ ...value, profiles: { ...value.profiles, visible: event.target.checked } })} /> {value.profiles.visible ? copy.adminVisible : copy.adminHidden}</label>
      <label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={3} value={value.profiles.description} onChange={event => update({ ...value, profiles: { ...value.profiles, description: event.target.value } })} maxLength={400} /></label>
      <label>{copy.adminCategoriesSection}<input className="admin-input" value={value.categories.title} onChange={event => update({ ...value, categories: { ...value.categories, title: event.target.value } })} maxLength={160} required /></label>
      <label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={3} value={value.categories.description} onChange={event => update({ ...value, categories: { ...value.categories, description: event.target.value } })} maxLength={400} /></label>
      <label>{copy.adminItemLimit}<input className="admin-input" type="number" min={1} max={12} value={value.categories.itemLimit} onChange={event => update({ ...value, categories: { ...value.categories, itemLimit: Number(event.target.value) } })} /></label>
      <label>{copy.adminDisplayMode}<select className="admin-input" value={value.categories.displayMode} onChange={event => update({ ...value, categories: { ...value.categories, displayMode: event.target.value as HomepageSettings["categories"]["displayMode"] } })}><option value="grid">grid</option><option value="list">list</option></select></label>
      <label>{copy.adminAboutSection}<input className="admin-input" value={value.about.title} onChange={event => update({ ...value, about: { ...value.about, title: event.target.value } })} maxLength={160} required /></label>
      <label><input type="checkbox" checked={value.about.visible} onChange={event => update({ ...value, about: { ...value.about, visible: event.target.checked } })} /> {value.about.visible ? copy.adminVisible : copy.adminHidden}</label>
      <label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={3} value={value.about.description} onChange={event => update({ ...value, about: { ...value.about, description: event.target.value } })} maxLength={500} /></label>
      <label>{copy.adminFinalCta}<input className="admin-input" value={value.finalCta.title} onChange={event => update({ ...value, finalCta: { ...value.finalCta, title: event.target.value } })} maxLength={160} required /></label>
      <label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={3} value={value.finalCta.description} onChange={event => update({ ...value, finalCta: { ...value.finalCta, description: event.target.value } })} maxLength={400} /></label>
      <label>{copy.adminLabel}<input className="admin-input" value={value.finalCta.button.label} onChange={event => update({ ...value, finalCta: { ...value.finalCta, button: { ...value.finalCta.button, label: event.target.value } } })} maxLength={100} required /></label>
      <label>{copy.adminUrl}<input className="admin-input" dir="ltr" value={value.finalCta.button.href} onChange={event => update({ ...value, finalCta: { ...value.finalCta, button: { ...value.finalCta.button, href: event.target.value } } })} maxLength={1000} required /></label>
    </div>
  </div>;
}

function NavigationFields({ value, copy, update, directoryOptions }: { value: NavigationSettings; copy: FoundationMessages; update: (value: NavigationSettings) => void; directoryOptions: SiteExperienceDirectoryOptions }) {
  const list = (key: "header" | "footer", label: string) => {
    const items = [...value[key]].sort((a, b) => a.order - b.order);
    const replace = (next: NavigationSettings[typeof key]) => update({ ...value, [key]: next.map((item, order) => ({ ...item, order })) });
    const add = () => replace([...items, { id: `nav-${crypto.randomUUID()}`, label: "", href: "/", kind: "internal", visible: true, order: items.length }]);
    const move = (index: number, direction: -1 | 1) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; replace(next); };
    return <section className="admin-fieldset"><div className="admin-section-heading"><h2>{label}</h2><button className="admin-inline-button" type="button" onClick={add}>{copy.adminAddLink}</button></div>{items.map((item, index) => <div className="admin-repeat-row" key={item.id}><label>{copy.adminLabel}<input className="admin-input" value={item.label} onChange={event => replace(items.map(entry => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} maxLength={120} required /></label><label>{copy.adminUrl}<input className="admin-input" list={`navigation-options-${item.id}`} dir="ltr" value={item.href} onChange={event => replace(items.map(entry => entry.id === item.id ? { ...entry, href: event.target.value } : entry))} maxLength={1000} required /><datalist id={`navigation-options-${item.id}`}><option value="/" /><option value="/search" /><option value="/categories" /><option value="/about" />{directoryOptions.categories.map(category => <option key={`category-${category.id}`} value={`/categories/${category.slug}`} />)}{directoryOptions.people.map(person => <option key={`person-${person.id}`} value={`/person/${person.slug}`} />)}</datalist></label><label>{copy.adminExternalLink}<select className="admin-input" value={item.kind} onChange={event => replace(items.map(entry => entry.id === item.id ? { ...entry, kind: event.target.value as "internal" | "external" } : entry))}><option value="internal">internal</option><option value="external">external</option></select></label><label><input type="checkbox" checked={item.visible} onChange={event => replace(items.map(entry => entry.id === item.id ? { ...entry, visible: event.target.checked } : entry))} /> {item.visible ? copy.adminVisible : copy.adminHidden}</label><div className="admin-button-row"><button className="button button-quiet" type="button" onClick={() => move(index, -1)} disabled={index === 0}>{copy.adminMoveUp}</button><button className="button button-quiet" type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}>{copy.adminMoveDown}</button><button className="button button-quiet" type="button" onClick={() => replace(items.filter(entry => entry.id !== item.id))}>{copy.adminRemove}</button></div></div>)}</section>;
  };
  return <div className="admin-form-stack"><p className="admin-field-hint">{copy.adminNavigationManager}</p>{list("header", copy.adminNavigationManager)}{list("footer", copy.adminFooterManager)}</div>;
}

function FooterFields({ value, copy, update }: { value: FooterSettings; copy: FoundationMessages; update: (value: FooterSettings) => void }) {
  const addLegal = () => update({ ...value, legalLinks: [...value.legalLinks, { id: `legal-${crypto.randomUUID()}`, label: "", href: "/", kind: "internal", visible: true, order: value.legalLinks.length }] });
  const addGroup = () => update({ ...value, groups: [...value.groups, { id: `group-${crypto.randomUUID()}`, title: "", links: [] }] });
  const updateGroup = (groupId: string, patch: Partial<FooterSettings["groups"][number]>) => update({ ...value, groups: value.groups.map(group => group.id === groupId ? { ...group, ...patch } : group) });
  const addGroupLink = (group: FooterSettings["groups"][number]) => updateGroup(group.id, { links: [...group.links, { id: `footer-${crypto.randomUUID()}`, label: "", href: "/", kind: "internal", visible: true, order: group.links.length }] });
  const moveGroupLink = (group: FooterSettings["groups"][number], index: number, direction: -1 | 1) => { const next = [...group.links]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; updateGroup(group.id, { links: next.map((link, order) => ({ ...link, order })) }); };
  const addSocial = () => update({ ...value, socialLinks: [...value.socialLinks, { platform: "other", label: "", url: "" }] });
  return <div className="admin-form-stack"><div className="admin-form-grid"><label className="admin-form-wide">{copy.adminSectionDescription}<textarea className="admin-input" rows={4} value={value.description} onChange={event => update({ ...value, description: event.target.value })} maxLength={500} /></label><label>{copy.adminCopyright}<input className="admin-input" value={value.copyright} onChange={event => update({ ...value, copyright: event.target.value })} maxLength={240} /></label><label>{copy.adminUrl}<input className="admin-input" dir="ltr" value={value.contactHref} onChange={event => update({ ...value, contactHref: event.target.value })} maxLength={1000} /></label></div><fieldset className="admin-fieldset"><legend>{copy.adminFooterManager}</legend><div className="admin-section-heading"><span>{copy.adminLegalLinks}</span><button className="admin-inline-button" type="button" onClick={addLegal}>{copy.adminAddLink}</button></div>{value.legalLinks.map((item, index) => <div className="admin-repeat-row" key={item.id}><input className="admin-input" value={item.label} aria-label={copy.adminLabel} onChange={event => update({ ...value, legalLinks: value.legalLinks.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} /><input className="admin-input" dir="ltr" value={item.href} aria-label={copy.adminUrl} onChange={event => update({ ...value, legalLinks: value.legalLinks.map((entry, i) => i === index ? { ...entry, href: event.target.value } : entry) })} /><button className="button button-quiet" type="button" onClick={() => update({ ...value, legalLinks: value.legalLinks.filter(entry => entry.id !== item.id) })}>{copy.adminRemove}</button></div>)}</fieldset><fieldset className="admin-fieldset"><legend>{copy.adminAddGroup}</legend><button className="admin-inline-button" type="button" onClick={addGroup}>{copy.adminAddGroup}</button>{value.groups.map((group, index) => <div className="admin-repeat-row footer-group-editor" key={group.id}><div className="admin-section-heading"><input className="admin-input" value={group.title} aria-label={copy.adminSectionTitle} onChange={event => updateGroup(group.id, { title: event.target.value })} maxLength={100} required /><div className="admin-button-row"><button className="button button-quiet" type="button" onClick={() => { if (index === 0) return; const groups = [...value.groups]; [groups[index - 1], groups[index]] = [groups[index], groups[index - 1]]; update({ ...value, groups }); }} disabled={index === 0}>{copy.adminMoveUp}</button><button className="button button-quiet" type="button" onClick={() => { if (index === value.groups.length - 1) return; const groups = [...value.groups]; [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]]; update({ ...value, groups }); }} disabled={index === value.groups.length - 1}>{copy.adminMoveDown}</button><button className="button button-quiet" type="button" onClick={() => update({ ...value, groups: value.groups.filter(entry => entry.id !== group.id) })}>{copy.adminRemove}</button></div></div><div className="admin-repeat-list">{group.links.map((link, index) => <div className="admin-repeat-row" key={link.id}><input className="admin-input" value={link.label} aria-label={copy.adminLabel} onChange={event => updateGroup(group.id, { links: group.links.map(entry => entry.id === link.id ? { ...entry, label: event.target.value } : entry) })} /><input className="admin-input" dir="ltr" value={link.href} aria-label={copy.adminUrl} onChange={event => updateGroup(group.id, { links: group.links.map(entry => entry.id === link.id ? { ...entry, href: event.target.value } : entry) })} /><label><input type="checkbox" checked={link.visible} onChange={event => updateGroup(group.id, { links: group.links.map(entry => entry.id === link.id ? { ...entry, visible: event.target.checked } : entry) })} /> {link.visible ? copy.adminVisible : copy.adminHidden}</label><div className="admin-button-row"><button className="button button-quiet" type="button" onClick={() => moveGroupLink(group, index, -1)} disabled={index === 0}>{copy.adminMoveUp}</button><button className="button button-quiet" type="button" onClick={() => moveGroupLink(group, index, 1)} disabled={index === group.links.length - 1}>{copy.adminMoveDown}</button><button className="button button-quiet" type="button" onClick={() => updateGroup(group.id, { links: group.links.filter(entry => entry.id !== link.id) })}>{copy.adminRemove}</button></div></div>)}</div><button className="admin-inline-button" type="button" onClick={() => addGroupLink(group)}>{copy.adminAddLink}</button></div>)}</fieldset><fieldset className="admin-fieldset"><legend>{copy.adminAddSocialLink}</legend><button className="admin-inline-button" type="button" onClick={addSocial}>{copy.adminAddSocialLink}</button>{value.socialLinks.map((link, index) => <div className="admin-repeat-row" key={`${link.platform}-${index}`}><select className="admin-input" aria-label={copy.adminLabel} value={link.platform} onChange={event => update({ ...value, socialLinks: value.socialLinks.map((entry, i) => i === index ? { ...entry, platform: event.target.value as typeof link.platform } : entry) })}><option value="linkedin">LinkedIn</option><option value="x">X</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="github">GitHub</option><option value="other">other</option></select><input className="admin-input" value={link.label} aria-label={copy.adminLabel} onChange={event => update({ ...value, socialLinks: value.socialLinks.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} maxLength={80} required /><input className="admin-input" dir="ltr" value={link.url} aria-label={copy.adminUrl} onChange={event => update({ ...value, socialLinks: value.socialLinks.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry) })} maxLength={1000} required /><button className="button button-quiet" type="button" onClick={() => update({ ...value, socialLinks: value.socialLinks.filter((_, i) => i !== index) })}>{copy.adminRemove}</button></div>)}</fieldset></div>;
}

function SeoFields({ value, copy, update }: { value: SeoSettings; copy: FoundationMessages; update: (value: SeoSettings) => void }) {
  return <div className="admin-form-grid"><label className="admin-form-wide">{copy.adminSeoTitle}<input className="admin-input" value={value.siteTitle} onChange={event => update({ ...value, siteTitle: event.target.value })} maxLength={160} required /></label><label className="admin-form-wide">{copy.adminDefaultDescription}<textarea className="admin-input" rows={4} value={value.defaultDescription} onChange={event => update({ ...value, defaultDescription: event.target.value })} maxLength={500} /></label><label>{copy.adminKeywords}<input className="admin-input" value={value.defaultKeywords.join(", ")} onChange={event => update({ ...value, defaultKeywords: event.target.value.split(",").map(item => item.trim()).filter(Boolean) })} maxLength={1200} /></label><label>{copy.adminOgImage}<input className="admin-input" dir="ltr" value={value.defaultOgImage} onChange={event => update({ ...value, defaultOgImage: event.target.value })} maxLength={1000} /></label><label>{copy.adminTwitterCard}<select className="admin-input" value={value.twitterCard} onChange={event => update({ ...value, twitterCard: event.target.value as SeoSettings["twitterCard"] })}><option value="summary">summary</option><option value="summary_large_image">summary_large_image</option></select></label><label>{copy.adminCanonicalBase}<input className="admin-input" dir="ltr" value={value.canonicalBase} onChange={event => update({ ...value, canonicalBase: event.target.value })} maxLength={1000} /></label><label><input type="checkbox" checked={value.indexingAllowed} onChange={event => update({ ...value, indexingAllowed: event.target.checked })} /> {copy.adminIndexingAllowed}</label></div>;
}

function ProfilePresentationFields({ value, copy, update }: { value: ProfilePresentationSettings; copy: FoundationMessages; update: (value: ProfilePresentationSettings) => void }) {
  return <div className="admin-form-grid"><label>{copy.adminTemplate}<select className="admin-input" value={value.templateId} onChange={event => update({ ...value, templateId: event.target.value as "classic" })}><option value="classic">classic</option></select></label>{(["showPortfolio", "showContactCta", "showSocialLinks", "showPrintButton", "showShareControls"] as const).map(key => <label key={key}><input type="checkbox" checked={value[key]} onChange={event => update({ ...value, [key]: event.target.checked })} /> {copy[key === "showPortfolio" ? "adminShowPortfolio" : key === "showContactCta" ? "adminShowContact" : key === "showSocialLinks" ? "adminShowSocial" : key === "showPrintButton" ? "adminShowPrint" : "adminShowShare"]}</label>)}<fieldset className="admin-fieldset admin-form-wide"><legend>{copy.adminSectionOrder}</legend><ol className="admin-sortable-list">{value.defaultSectionOrder.map((section, index) => <li key={section}><span>{section}</span><button className="button button-quiet" type="button" onClick={() => { if (index === 0) return; const next = [...value.defaultSectionOrder]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update({ ...value, defaultSectionOrder: next }); }} disabled={index === 0}>{copy.adminMoveUp}</button><button className="button button-quiet" type="button" onClick={() => { if (index === value.defaultSectionOrder.length - 1) return; const next = [...value.defaultSectionOrder]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; update({ ...value, defaultSectionOrder: next }); }} disabled={index === value.defaultSectionOrder.length - 1}>{copy.adminMoveDown}</button></li>)}</ol></fieldset></div>;
}
