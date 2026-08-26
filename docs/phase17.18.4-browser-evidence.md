# Phase 17.18.4 — Browser Evidence

**Route:** `https://a3-lam.vercel.app/admin/ai`

**Environment:** Sandbox Chromium session with persisted authenticated Admin state; read-only inspection only; no click, upload, generation, review mutation, or form submission.

**Observed:** The page renders the A3LAM AI Admin workspace in Arabic RTL. It shows the private-by-default notice and explicitly states that no inference or AI-provider call was executed. Provider and generation provider show configuration-required state. The generation section lists the five supported modes—Professional CV, Professional Profile, A3LAM Person Draft, Biography, and SEO Draft—and four output-language modes—Arabic, English, Bilingual, and Source Language. It explicitly states that generation is disabled until an approved provider and private persistence are configured, and every generated result remains DRAFT.

The pipeline labels Uploaded, Extracted, Facts, Generation, Review, and Approved as empty (`—`) rather than inventing progress or counters. Generation status and quality gate are also `—`, and the generated-claims review state says that no generated claims are available. The document uploader input and action remain disabled. The private documents area reports the pending persistence migration/database-unavailable state and shows no documents or review facts.

The extraction section reports PDF/DOCX/TXT as available for isolated local testing only, with the documented bounded safety limits. No AI-generated content, raw document text, evidence, storage key, provider credential, or internal generation payload was observed in public content.

**Result:** PASS WITH LIMITATIONS. Provider, persistence, storage, queue, malware-scanning, and retention dependencies remain intentionally unconfigured; the UI is truthful and no production mutation was performed.

**Screenshot captured by browser inspection:** `/home/ubuntu/screenshots/a3-lam_vercel_app_2026-08-26_23-00-09_1820.webp`
