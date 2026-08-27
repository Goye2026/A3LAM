"use client";

import { useMemo, useState } from "react";
import type { FoundationMessages } from "@/lib/i18n/messages";
import type { AiGeneratedClaim, AiGenerationLanguage, AiGenerationMode, AiGenerationResult } from "@/lib/ai/types";
import { A3lamDocumentUploader } from "./A3lamDocumentUploader";
import { demoConflict, demoExtraction, demoFacts, runEditorialDemo, type DemoFact } from "./editorialDemo";

const steps = ["adminAiStepDocument", "adminAiStepExtraction", "adminAiStepFacts", "adminAiStepGeneration", "adminAiStepDraft", "adminAiStepClaims", "adminAiStepReview"] as const;
const modes: AiGenerationMode[] = ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"];
const languages: AiGenerationLanguage[] = ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"];

type Copy = FoundationMessages;

type ClaimAction = "ACCEPT" | "EDIT" | "REJECT" | "REQUEST_SOURCE";

function valueOf(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  try { return JSON.stringify(value); } catch { return "—"; }
}

function modeLabel(mode: AiGenerationMode, copy: Copy) {
  if (mode === "PROFESSIONAL_CV") return copy.adminAiModeProfessionalCv;
  if (mode === "PROFESSIONAL_PROFILE") return copy.adminAiModeProfessionalProfile;
  if (mode === "A3LAM_PERSON_DRAFT") return copy.adminAiModePersonDraft;
  if (mode === "BIOGRAPHY") return copy.adminAiModeBiography;
  return copy.adminAiModeSeo;
}

function languageLabel(language: AiGenerationLanguage, copy: Copy) {
  if (language === "ARABIC") return copy.adminAiLanguageArabic;
  if (language === "ENGLISH") return copy.adminAiLanguageEnglish;
  if (language === "BILINGUAL") return copy.adminAiLanguageBilingual;
  return copy.adminAiLanguageSource;
}

function modeDescription(mode: AiGenerationMode, copy: Copy) {
  if (mode === "PROFESSIONAL_CV") return copy.adminAiModeProfessionalCvDescription;
  if (mode === "PROFESSIONAL_PROFILE") return copy.adminAiModeProfessionalProfileDescription;
  if (mode === "A3LAM_PERSON_DRAFT") return copy.adminAiModePersonDraftDescription;
  if (mode === "BIOGRAPHY") return copy.adminAiModeBiographyDescription;
  return copy.adminAiModeSeoDescription;
}

function modeGlyph(mode: AiGenerationMode) {
  if (mode === "PROFESSIONAL_CV") return "CV";
  if (mode === "PROFESSIONAL_PROFILE") return "P";
  if (mode === "A3LAM_PERSON_DRAFT") return "A3";
  if (mode === "BIOGRAPHY") return "B";
  return "SEO";
}

function factStatusLabel(status: DemoFact["status"], copy: Copy) {
  if (status === "ACCEPTED" || status === "EDITED") return copy.adminAiSourceBacked;
  if (status === "REJECTED") return copy.adminAiBlocked;
  return copy.adminAiNeedsVerification;
}

function claimStatusLabel(claim: AiGeneratedClaim, copy: Copy) {
  if (claim.status === "CONFLICTED") return copy.adminAiConflictDetected;
  if (claim.status === "VERIFIED") return copy.adminAiSourceBacked;
  if (claim.status === "REJECTED") return copy.adminAiBlocked;
  return copy.adminAiNeedsVerification;
}

export function A3lamEditorialWorkspace({ copy }: { copy: Copy }) {
  const [activeStep, setActiveStep] = useState(0);
  const [facts, setFacts] = useState<DemoFact[]>(() => demoFacts.map((fact) => ({ ...fact })));
  const [mode, setMode] = useState<AiGenerationMode>("A3LAM_PERSON_DRAFT");
  const [language, setLanguage] = useState<AiGenerationLanguage>("ARABIC");
  const [result, setResult] = useState<AiGenerationResult | null>(null);
  const [claims, setClaims] = useState<AiGeneratedClaim[]>([]);
  const [claimEdits, setClaimEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(demoFacts[0]?.id ?? null);
  const [savedDraft, setSavedDraft] = useState(false);

  const reviewedFacts = useMemo(() => facts.filter((fact) => fact.status === "ACCEPTED" || fact.status === "EDITED"), [facts]);
  const unresolvedFacts = useMemo(() => facts.filter((fact) => fact.status === "UNREVIEWED" || fact.status === "REQUEST_SOURCE"), [facts]);
  const reviewedClaims = claims.filter((claim) => claim.status === "VERIFIED" || claim.status === "REJECTED");
  const unresolvedClaims = claims.filter((claim) => claim.status === "CONFLICTED" || claim.status === "NEEDS_VERIFICATION");
  const rejectedClaims = claims.filter((claim) => claim.status === "REJECTED");
  const editedFacts = facts.filter((fact) => fact.status === "EDITED");
  const selectedFact = facts.find((fact) => fact.id === selectedFactId) ?? facts[0] ?? null;
  const qualityState = !result ? "BLOCKED" : unresolvedFacts.length > 0 || unresolvedClaims.length > 0 ? "WARNING" : "PASS";
  const progressValue = Math.round(((activeStep + 1) / steps.length) * 100);
  const progressText = copy.adminAiStepOf.replace("{current}", String(activeStep + 1)).replace("{total}", String(steps.length));
  const nextActionLabel = activeStep === steps.length - 1 ? copy.adminAiSaveDraft : copy[steps[activeStep + 1]];

  const resetDemo = () => {
    setFacts(demoFacts.map((fact) => ({ ...fact })));
    setMode("A3LAM_PERSON_DRAFT");
    setLanguage("ARABIC");
    setResult(null);
    setClaims([]);
    setClaimEdits({});
    setSelectedFactId(demoFacts[0]?.id ?? null);
    setSavedDraft(false);
    setActiveStep(0);
    setNotice(null);
    setError(null);
  };

  const reviewFact = (factId: string, status: DemoFact["status"], reviewedValue?: string) => {
    setSelectedFactId(factId);
    setFacts((current) => current.map((fact) => fact.id === factId ? { ...fact, status, reviewedValue: reviewedValue?.trim() || undefined } : fact));
    setNotice(copy.adminAiDemoGenerated);
    setError(null);
  };

  const runGeneration = async () => {
    setError(null);
    setNotice(null);
    if (reviewedFacts.length === 0) {
      setError(copy.adminAiReviewRequiredBeforeProceed);
      return;
    }
    setBusy(true);
    try {
      const generated = await runEditorialDemo(mode, language, facts);
      setResult(generated);
      setClaims(generated.claims);
      setSavedDraft(false);
      setNotice(copy.adminAiDemoGenerated);
      setActiveStep(4);
    } catch {
      setError(copy.adminAiGenerationDisabled);
    } finally {
      setBusy(false);
    }
  };

  const reviewClaim = (claim: AiGeneratedClaim, action: ClaimAction) => {
    const editedValue = action === "EDIT" ? claimEdits[claim.id]?.trim() : undefined;
    if (action === "EDIT" && !editedValue) {
      setError(copy.adminAiReviewRequiredBeforeProceed);
      return;
    }
    const status: AiGeneratedClaim["status"] = action === "ACCEPT" || action === "EDIT" ? "VERIFIED" : action === "REJECT" ? "REJECTED" : "NEEDS_VERIFICATION";
    setClaims((current) => current.map((item) => item.id === claim.id ? { ...item, status, value: editedValue ?? item.value } : item));
    setNotice(copy.adminAiDemoGenerated);
    setError(null);
  };

  const saveLocalDraft = () => {
    if (!result?.draft) return;
    setSavedDraft(true);
    setNotice(copy.adminAiDemoGenerated);
    setError(null);
  };

  const stepDone = (index: number) => {
    if (index <= 1) return true;
    if (index === 2) return reviewedFacts.length > 0;
    if (index === 3) return Boolean(result);
    if (index === 4) return Boolean(result?.draft);
    if (index === 5) return claims.length > 0;
    return reviewedClaims.length === claims.length && claims.length > 0;
  };

  return (
    <section className="ai-editorial-workspace" aria-labelledby="ai-editorial-workspace-title">
      <header className="ai-workspace-hero">
        <div>
          <p className="eyebrow">{copy.adminAiWorkspaceTitle}</p>
          <h2 id="ai-editorial-workspace-title">{copy.adminAiWorkspaceTitle}</h2>
          <p>{copy.adminAiWorkspaceDescription}</p>
          <p className="ai-workspace-kicker"><span className="ai-sandbox-mark" aria-hidden="true">S</span>{copy.adminAiSandboxLabel}</p>
        </div>
        <div className="ai-boundary-callout" role="note">
          <strong>{copy.adminAiBoundaryDraftPerson}</strong>
          <strong>{copy.adminAiBoundaryDraftProfile}</strong>
          <strong>{copy.adminAiBoundaryDraftPublished}</strong>
        </div>
      </header>

      <div className="admin-alert ai-demo-notice" role="status">
        <strong>{copy.adminAiLocalDemoNotice}</strong>
        <span>{copy.adminAiProductionDisabled}</span>
        <span>{copy.adminAiMockAvailable}</span>
      </div>

      <div className="ai-workflow-summary" aria-label={copy.adminAiProgress}>
        <div className="ai-workflow-summary-heading"><div><span className="ai-summary-label">{copy.adminAiProgress}</span><strong>{progressText}</strong></div><div><span className="ai-summary-label">{copy.adminAiNextAction}</span><strong>{nextActionLabel}</strong></div></div>
        <div className="ai-progress-track" role="progressbar" aria-label={copy.adminAiProgress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue}><span style={{ width: `${progressValue}%` }} /></div>
        <p>{copy.adminAiWorkflowIntro}</p>
      </div>

      <nav className="ai-stepper" aria-label={copy.adminAiWorkspaceTitle}>
        <ol>
          {steps.map((key, index) => {
            const label = copy[key];
            return <li key={key} className={activeStep === index ? "is-active" : stepDone(index) ? "is-done" : ""}>
              <button type="button" aria-current={activeStep === index ? "step" : undefined} onClick={() => { setActiveStep(index); setError(null); }}>
                <span className="ai-step-number">{index + 1}</span>
                <span>{label}</span>
                <small>{stepDone(index) ? copy.adminAiPass : copy.adminAiNeedsVerification}</small>
              </button>
            </li>;
          })}
        </ol>
      </nav>

      {notice ? <p className="ai-inline-success" role="status">{notice}</p> : null}
      {error ? <p className="admin-alert" role="alert">{error}</p> : null}

      {activeStep === 0 ? <section className="ai-step-panel" aria-labelledby="ai-step-document-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepDocument}</p><h3 id="ai-step-document-title">{copy.adminAiSelectedDocument}</h3></div><span className="admin-launch-status admin-launch-status-requires_configuration">{copy.adminAiProductionDisabled}</span></div>
        <div className="ai-document-intake-grid">
          <div className="ai-document-summary"><span className="ai-file-mark">TXT</span><div><strong>{demoExtraction.fileName}</strong><p>{demoExtraction.size} · {demoExtraction.format}</p></div><span className="ai-status-pill ai-status-pill-ready">{copy.adminAiPass}</span></div>
          <div className="ai-document-actions"><button type="button" className="button button-primary" onClick={() => { setActiveStep(1); setNotice(null); }}>{copy.adminAiRunIsolatedDemo}</button><button type="button" className="button button-quiet" onClick={resetDemo}>{copy.adminAiRemoveSelection}</button></div>
        </div>
        <p className="admin-field-hint">{copy.adminAiDropzoneHint}</p>
        <A3lamDocumentUploader copy={copy} disabled={false} localOnly onFileSelected={() => { setNotice(copy.adminAiLocalFileSelected); setError(null); }} />
      </section> : null}

      {activeStep === 1 ? <section className="ai-step-panel" aria-labelledby="ai-step-extraction-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepExtraction}</p><h3 id="ai-step-extraction-title">{copy.adminAiExtractedText}</h3></div><span className="admin-launch-status admin-launch-status-available">{demoExtraction.processingState}</span></div>
        <div className="ai-metadata-grid"><div><span>{copy.adminAiDetectedLanguage}</span><strong>{demoExtraction.language}</strong></div><div><span>{copy.adminAiProcessingState}</span><strong>{demoExtraction.processingState}</strong></div><div><span>{copy.adminAiSections}</span><strong>{demoExtraction.sections.length}</strong></div><div><span>{copy.adminAiParagraphs}</span><strong>{demoExtraction.paragraphs.length}</strong></div></div>
        <div className="ai-extraction-layout"><aside><h4>{copy.adminAiSections}</h4><ol className="ai-section-list">{demoExtraction.sections.map((section) => <li key={section.id}><span>{section.label}</span><small>{section.range}</small></li>)}</ol></aside><div><h4>{copy.adminAiExtractedText}</h4><pre className="ai-private-text ai-extraction-text">{demoExtraction.text}</pre><p className="ai-limit-note">{copy.adminAiOcrNotice}</p><p className="ai-limit-note">{copy.adminAiDocxNotice}</p></div></div>
        <div className="ai-step-actions"><button type="button" className="button button-primary" onClick={() => setActiveStep(2)}>{copy.adminAiStepFacts}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(0)}>{copy.adminAiBack}</button></div>
      </section> : null}

      {activeStep === 2 ? <section className="ai-step-panel" aria-labelledby="ai-step-facts-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepFacts}</p><h3 id="ai-step-facts-title">{copy.adminAiReviewValue}</h3></div><span className="admin-launch-status admin-launch-status-not_tested">{reviewedFacts.length}/{facts.length}</span></div>
        <p className="admin-field-hint">{copy.adminAiReviewRequiredBeforeProceed}</p>
        <div className="ai-conflict-card" role="alert"><div><strong>{copy.adminAiConflictDetected}</strong><span>{demoConflict.fieldPath}</span></div><div><span>{copy.adminAiSourceA}</span><strong>{demoConflict.sourceA.value}</strong></div><div><span>{copy.adminAiSourceB}</span><strong>{demoConflict.sourceB.value}</strong></div><small>{copy.adminAiNeedsHumanReview}</small></div>
        <div className="ai-fact-list">{facts.map((fact) => <article className={`ai-fact-card ai-fact-card-${fact.status.toLowerCase()} ${selectedFactId === fact.id ? "is-selected" : ""}`} key={fact.id}>
          <button type="button" className="ai-fact-select" onClick={() => setSelectedFactId(fact.id)} aria-pressed={selectedFactId === fact.id}><span><span className="ai-fact-field">{fact.fieldPath}</span><strong>{fact.value}</strong></span><span className="ai-status-pill">{factStatusLabel(fact.status, copy)}</span></button>
          <dl className="ai-fact-meta"><div><dt>{copy.adminAiReviewConfidence}</dt><dd>{fact.confidence}</dd></div><div><dt>{copy.adminAiReviewClassification}</dt><dd>{fact.classification}</dd></div><div><dt>{copy.adminAiReviewSource}</dt><dd>{fact.source}</dd></div></dl>
          <details><summary>{copy.adminAiOpenSource}</summary><p><strong>{fact.location}</strong></p><blockquote>{fact.evidence}</blockquote><small>{fact.provenance.startOffset}–{fact.provenance.endOffset} · {fact.provenance.section}</small></details>
          <div className="ai-fact-actions"><button type="button" className="button button-quiet" onClick={() => reviewFact(fact.id, "ACCEPTED")}>{copy.adminAiAccept}</button><button type="button" className="button button-quiet" onClick={() => reviewFact(fact.id, "EDITED", `${fact.value} · ${copy.adminAiEditedSuffix}`) }>{copy.adminAiEdit}</button><button type="button" className="button button-quiet" onClick={() => reviewFact(fact.id, "REJECTED")}>{copy.adminAiReject}</button><button type="button" className="button button-quiet" onClick={() => reviewFact(fact.id, "REQUEST_SOURCE")}>{copy.adminAiRequestSource}</button></div>
        </article>)}        </div>
        {selectedFact ? <aside className="ai-fact-detail" aria-live="polite" aria-labelledby="ai-selected-fact-title"><div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiReviewField}</p><h4 id="ai-selected-fact-title">{selectedFact.fieldPath}</h4></div><span className="ai-status-pill">{factStatusLabel(selectedFact.status, copy)}</span></div><dl className="ai-fact-detail-grid"><div><dt>{copy.adminAiOriginalValue}</dt><dd>{selectedFact.originalValue}</dd></div><div><dt>{copy.adminAiReviewedValue}</dt><dd>{selectedFact.reviewedValue ?? "—"}</dd></div><div><dt>{copy.adminAiReviewer}</dt><dd>{selectedFact.status === "UNREVIEWED" ? "—" : copy.adminAiLocalOnly}</dd></div><div><dt>{copy.adminAiDecision}</dt><dd>{selectedFact.status}</dd></div></dl><p className="ai-fact-detail-source"><strong>{selectedFact.source}</strong> · {selectedFact.location}</p><blockquote>{selectedFact.evidence}</blockquote></aside> : null}
        <div className="ai-step-actions"><button type="button" className="button button-primary" onClick={() => setActiveStep(3)} disabled={reviewedFacts.length === 0}>{copy.adminAiStepGeneration}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(1)}>{copy.adminAiBack}</button></div>
      </section> : null}

      {activeStep === 3 ? <section className="ai-step-panel" aria-labelledby="ai-step-generation-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepGeneration}</p><h3 id="ai-step-generation-title">{copy.adminAiGenerationChooseMode}</h3></div><span className="admin-launch-status admin-launch-status-requires_configuration">{copy.adminAiProductionDisabled}</span></div>
        <div className="ai-generation-config">
          <fieldset className="ai-mode-picker"><legend>{copy.adminAiGenerationChooseMode}</legend><div className="ai-mode-grid">{modes.map((item) => <label className={`ai-mode-option ${mode === item ? "is-selected" : ""}`} key={item}><input type="radio" name="ai-generation-mode" value={item} checked={mode === item} onChange={() => setMode(item)} /><span className="ai-mode-icon" aria-hidden="true">{modeGlyph(item)}</span><span><strong>{modeLabel(item, copy)}</strong><small>{modeDescription(item, copy)}</small></span></label>)}</div><p className="ai-selection-note"><span className="ai-summary-label">{copy.adminAiModeSelected}</span><strong>{modeLabel(mode, copy)}</strong></p></fieldset>
          <label className="ai-language-field">{copy.adminAiGenerationChooseLanguage}<select value={language} onChange={(event) => setLanguage(event.target.value as AiGenerationLanguage)}>{languages.map((item) => <option value={item} key={item}>{languageLabel(item, copy)}</option>)}</select><small>{copy.adminAiWorkflowIntro}</small></label>
        </div>
        <div className="ai-gate-strip"><span>{copy.adminAiSourcesCheck}</span><strong className={reviewedFacts.length > 0 ? "is-pass" : "is-blocked"}>{reviewedFacts.length > 0 ? copy.adminAiPass : copy.adminAiBlocked}</strong><span>{copy.adminAiPrivacyCheck}</span><strong className="is-pass">{copy.adminAiPass}</strong><span>{copy.adminAiProvider}</span><strong className="is-warning">{copy.adminAiMockAvailable}</strong></div>
        <div className="ai-step-actions"><button type="button" className="button button-primary" onClick={runGeneration} disabled={busy || reviewedFacts.length === 0}>{busy ? copy.adminAiReviewSaving : copy.adminAiRunGeneration}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(2)}>{copy.adminAiBack}</button></div>
      </section> : null}

      {activeStep === 4 ? <section className="ai-step-panel" aria-labelledby="ai-step-draft-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepDraft}</p><h3 id="ai-step-draft-title">{copy.adminAiFinalPrivateDraft}</h3></div><span className="admin-launch-status admin-launch-status-not_tested">{copy.adminAiDraftStatus}</span></div>
        {result?.draft ? <div className="ai-draft-preview"><div className="ai-draft-heading"><div className="ai-draft-avatar">A</div><div><span>{modeLabel(mode, copy)}</span><h4>{valueOf(result.draft.identity.nativeName?.value) || demoExtraction.fileName}</h4><p>{languageLabel(language, copy)} · {copy.adminAiAiWording}</p></div></div><div className="ai-draft-metrics"><div><span>{copy.adminAiSourceCoverage}</span><strong>{reviewedFacts.length}/{facts.length}</strong></div><div><span>{copy.adminAiUnresolved}</span><strong>{unresolvedClaims.length}</strong></div><div><span>{copy.adminAiRejected}</span><strong>{rejectedClaims.length}</strong></div></div><div className="ai-draft-sections">{result.claims.map((claim) => <article key={claim.id}><div><span>{claim.fieldPath}</span><strong>{valueOf(claim.value)}</strong></div><span className="ai-status-pill">{claimStatusLabel(claim, copy)}</span></article>)}</div></div> : <p className="admin-empty">{copy.adminAiNoLocalDraft}</p>}
        <p className="ai-private-draft-banner" role="status">{copy.adminAiPrivateDraftNotice}</p>
        <div className="ai-step-actions"><button type="button" className="button button-primary" onClick={() => setActiveStep(5)} disabled={!result}>{copy.adminAiStepClaims}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(3)}>{copy.adminAiBack}</button></div>
      </section> : null}

      {activeStep === 5 ? <section className="ai-step-panel" aria-labelledby="ai-step-claims-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepClaims}</p><h3 id="ai-step-claims-title">{copy.adminAiSourceFact} → {copy.adminAiGeneratedClaim}</h3></div><span className="admin-launch-status admin-launch-status-not_tested">{claims.length}</span></div>
        {claims.length === 0 ? <p className="admin-empty" role="status">{copy.adminAiGenerationNoClaims}</p> : <div className="ai-claim-comparison">{claims.map((claim) => <article className="ai-claim-card" key={claim.id}><div className="ai-claim-column"><span>{copy.adminAiSourceFact}</span><strong>{claim.fieldPath}</strong><p>{valueOf(facts.find((fact) => fact.id === claim.sourceFactIds[0])?.reviewedValue ?? facts.find((fact) => fact.id === claim.sourceFactIds[0])?.value)}</p></div><div className="ai-claim-arrow" aria-hidden="true">←</div><div className="ai-claim-column ai-claim-generated"><span>{copy.adminAiGeneratedClaim}</span><strong>{valueOf(claim.value)}</strong><p>{claimStatusLabel(claim, copy)} · {claim.confidence}</p><details><summary>{copy.adminAiOpenSource}</summary><blockquote>{claim.provenance[0]?.excerpt ?? copy.adminAiEvidenceUnavailable}</blockquote></details></div></article>)}</div>}
        <div className="ai-step-actions"><button type="button" className="button button-primary" onClick={() => setActiveStep(6)} disabled={claims.length === 0}>{copy.adminAiStepReview}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(4)}>{copy.adminAiBack}</button></div>
      </section> : null}

      {activeStep === 6 ? <section className="ai-step-panel" aria-labelledby="ai-step-review-title">
        <div className="admin-panel-heading"><div><p className="eyebrow">{copy.adminAiStepReview}</p><h3 id="ai-step-review-title">{copy.adminAiEditorialReadiness}</h3></div><span className={`admin-launch-status admin-launch-status-${qualityState.toLowerCase()}`}>{qualityState}</span></div>
        <div className="ai-quality-grid"><QualityItem label={copy.adminAiIdentityCheck} status="PASS" copy={copy} /><QualityItem label={copy.adminAiSourcesCheck} status={reviewedFacts.length > 0 ? "PASS" : "BLOCKED"} copy={copy} /><QualityItem label={copy.adminAiEvidenceCheck} status="WARNING" copy={copy} /><QualityItem label={copy.adminAiConflictsCheck} status={claims.some((claim) => claim.status === "CONFLICTED") ? "BLOCKED" : "PASS"} copy={copy} /><QualityItem label={copy.adminAiClaimsCheck} status={claims.length > 0 ? "WARNING" : "BLOCKED"} copy={copy} /><QualityItem label={copy.adminAiCompletenessCheck} status="PASS" copy={copy} /><QualityItem label={copy.adminAiPrivacyCheck} status="PASS" copy={copy} /><QualityItem label={copy.adminAiPublicationCheck} status="BLOCKED" copy={copy} /></div>
        <div className="ai-draft-metrics ai-review-overview"><div><span>{copy.adminAiSourceCoverage}</span><strong>{reviewedFacts.length}/{facts.length}</strong></div><div><span>{copy.adminAiUnresolved}</span><strong>{unresolvedFacts.length + unresolvedClaims.length}</strong></div><div><span>{copy.adminAiRejected}</span><strong>{rejectedClaims.length}</strong></div><div><span>{copy.adminAiEdited}</span><strong>{editedFacts.length}</strong></div></div>
        <div className="ai-claim-review-list"><h4>{copy.adminAiGenerationReview}</h4>{claims.map((claim) => <article key={claim.id}><div><span>{claim.fieldPath}</span><strong>{valueOf(claim.value)}</strong><small>{claimStatusLabel(claim, copy)}</small></div><div className="ai-claim-review-controls"><input value={claimEdits[claim.id] ?? valueOf(claim.value)} onChange={(event) => setClaimEdits((current) => ({ ...current, [claim.id]: event.target.value }))} aria-label={`${copy.adminAiClaimEdit}: ${claim.fieldPath}`} /><div><button type="button" className="button button-quiet" onClick={() => reviewClaim(claim, "ACCEPT")}>{copy.adminAiClaimAccept}</button><button type="button" className="button button-quiet" onClick={() => reviewClaim(claim, "EDIT")}>{copy.adminAiClaimEdit}</button><button type="button" className="button button-quiet" onClick={() => reviewClaim(claim, "REJECT")}>{copy.adminAiClaimReject}</button><button type="button" className="button button-quiet" onClick={() => reviewClaim(claim, "REQUEST_SOURCE")}>{copy.adminAiClaimRequestSource}</button></div></div></article>)}</div>
        <p className="ai-private-draft-banner" role="status">{copy.adminAiFinalBoundary}</p>
        <div className="ai-final-actions"><button type="button" className="button button-primary" onClick={saveLocalDraft} disabled={!result}>{copy.adminAiSaveDraft}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(5)} disabled={!claims.length}>{copy.adminAiContinueReview}</button><button type="button" className="button button-quiet" onClick={() => setActiveStep(5)}>{copy.adminAiBack}</button></div>
        {savedDraft ? <p className="ai-inline-success" role="status">{copy.adminAiDemoGenerated}</p> : null}
      </section> : null}
    </section>
  );
}

function QualityItem({ label, status, copy }: { label: string; status: "PASS" | "WARNING" | "BLOCKED"; copy: Copy }) {
  const labelForStatus = status === "PASS" ? copy.adminAiPass : status === "WARNING" ? copy.adminAiWarning : copy.adminAiBlocked;
  return <div className={`ai-quality-item ai-quality-item-${status.toLowerCase()}`}><span>{label}</span><strong>{labelForStatus}</strong></div>;
}
