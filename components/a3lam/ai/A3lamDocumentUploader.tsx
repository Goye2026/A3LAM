"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);

type UploaderCopy = {
  adminAiCreateFromDocument: string;
  adminAiConfigurationRequired: string;
  adminAiUploadHint: string;
  adminAiSupportedTypes: string;
  adminAiNoInference: string;
  adminAiUnsupportedType: string;
  adminAiInvalidSize: string;
  adminAiRemoveSelection: string;
};

export function A3lamDocumentUploader({ copy, disabled }: { copy: UploaderCopy; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inspect = (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.has(extension)) { setFileName(null); setError(copy.adminAiUnsupportedType); return; }
    if (file.size === 0 || file.size > MAX_BYTES) { setFileName(null); setError(copy.adminAiInvalidSize); return; }
    setError(null);
    setFileName(file.name);
  };

  return (
    <section className="admin-panel ai-uploader" aria-labelledby="ai-uploader-title">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">{copy.adminAiCreateFromDocument}</p>
          <h2 id="ai-uploader-title">{copy.adminAiCreateFromDocument}</h2>
        </div>
        <span className="admin-launch-status admin-launch-status-requires_configuration">{copy.adminAiConfigurationRequired}</span>
      </div>
      <p className="admin-field-hint">{copy.adminAiUploadHint}</p>
      <div className="ai-uploader-dropzone" aria-disabled={disabled}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => inspect(event.target.files?.[0])} disabled={disabled} aria-label={copy.adminAiCreateFromDocument} />
        <button type="button" className="button button-quiet" onClick={() => inputRef.current?.click()} disabled={disabled}>{copy.adminAiCreateFromDocument}</button>
        {fileName ? <p className="ai-uploader-file" role="status">{fileName}</p> : <p className="admin-field-hint">{copy.adminAiNoInference}</p>}
      </div>
      {error ? <p className="admin-alert" role="alert">{error}</p> : null}
      {fileName ? <button type="button" className="button button-quiet" onClick={() => { setFileName(null); setError(null); if (inputRef.current) inputRef.current.value = ""; }}>{copy.adminAiRemoveSelection}</button> : null}
    </section>
  );
}
