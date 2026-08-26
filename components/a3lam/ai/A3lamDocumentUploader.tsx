"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);

type UploaderCopy = {
  adminAiCreateFromDocument: string;
  adminAiConfigurationRequired: string;
  adminAiUploadHint: string;
  adminAiNoInference: string;
  adminAiUnsupportedType: string;
  adminAiInvalidSize: string;
  adminAiRemoveSelection: string;
  adminAiRetry: string;
  adminAiUploadProgress: string;
  adminAiLocalOnly: string;
  adminAiChooseLocalFile: string;
};

type UploaderState = "IDLE" | "UPLOADING" | "EXTRACTING" | "READY_FOR_REVIEW" | "FAILED";

type Props = {
  copy: UploaderCopy;
  disabled: boolean;
  state?: UploaderState;
  progress?: number;
  failureMessage?: string | null;
  onFileSelected?: (file: File) => void;
  onRetry?: () => void;
  onReset?: () => void;
  localOnly?: boolean;
};

function boundedProgress(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

export function A3lamDocumentUploader({ copy, disabled, state = "IDLE", progress, failureMessage, onFileSelected, onRetry, onReset, localOnly = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visibleProgress = boundedProgress(progress);

  const inspect = (file: File | undefined) => {
    if (!file || (disabled && !localOnly)) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.has(extension)) { setFileName(null); setError(copy.adminAiUnsupportedType); return; }
    if (file.size === 0 || file.size > MAX_BYTES) { setFileName(null); setError(copy.adminAiInvalidSize); return; }
    setError(null);
    setFileName(file.name);
    onFileSelected?.(file);
  };

  const clearSelection = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onReset?.();
  };

  return (
    <section className="admin-panel ai-uploader" aria-labelledby="ai-uploader-title">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">{copy.adminAiCreateFromDocument}</p>
          <h2 id="ai-uploader-title">{copy.adminAiCreateFromDocument}</h2>
        </div>
        <span className={`admin-launch-status ${localOnly ? "admin-launch-status-not_tested" : "admin-launch-status-requires_configuration"}`}>{localOnly ? copy.adminAiLocalOnly : copy.adminAiConfigurationRequired}</span>
      </div>
      <p className="admin-field-hint">{copy.adminAiUploadHint}</p>
      <div className="ai-uploader-dropzone" aria-disabled={disabled && !localOnly} onDragOver={(event) => { if (!disabled || localOnly) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (!disabled || localOnly) inspect(event.dataTransfer.files?.[0]); }}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => inspect(event.target.files?.[0])} disabled={disabled && !localOnly} aria-label={localOnly ? copy.adminAiChooseLocalFile : copy.adminAiCreateFromDocument} />
        <button type="button" className="button button-quiet" onClick={() => inputRef.current?.click()} disabled={disabled && !localOnly}>{localOnly ? copy.adminAiChooseLocalFile : copy.adminAiCreateFromDocument}</button>
        {fileName ? <p className="ai-uploader-file" role="status">{fileName}</p> : <p className="admin-field-hint">{copy.adminAiNoInference}</p>}
        {visibleProgress !== null ? <div className="ai-uploader-progress" role="status" aria-live="polite"><span>{copy.adminAiUploadProgress}</span><progress max="100" value={visibleProgress}>{visibleProgress}%</progress><strong>{visibleProgress}%</strong></div> : null}
      </div>
      {error || failureMessage ? <p className="admin-alert" role="alert">{error ?? failureMessage}</p> : null}
      {state === "FAILED" && onRetry ? <button type="button" className="button button-quiet" onClick={onRetry}>{copy.adminAiRetry}</button> : null}
      {fileName ? <button type="button" className="button button-quiet" onClick={clearSelection}>{copy.adminAiRemoveSelection}</button> : null}
    </section>
  );
}
