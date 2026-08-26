import type { AiDocumentType } from "./types";

export type DocumentStorageState = "AVAILABLE" | "REQUIRES_CONFIGURATION";

export type DocumentStorageMetadata = {
  key: string;
  documentType: AiDocumentType;
  mimeType: string;
  sizeBytes: number;
};

export class DocumentStorageUnavailableError extends Error {
  constructor(message = "Private document storage is not configured") { super(message); this.name = "DocumentStorageUnavailableError"; }
}

export type DocumentStorage = {
  readonly state: DocumentStorageState;
  put(metadata: DocumentStorageMetadata, bytes: Uint8Array): Promise<{ key: string }>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<DocumentStorageMetadata | null>;
};

export function getDocumentStorageState(): DocumentStorageState { return "REQUIRES_CONFIGURATION"; }

export const unavailableDocumentStorage: DocumentStorage = {
  state: "REQUIRES_CONFIGURATION",
  async put() { throw new DocumentStorageUnavailableError(); },
  async get() { throw new DocumentStorageUnavailableError(); },
  async delete() { throw new DocumentStorageUnavailableError(); },
  async exists() { throw new DocumentStorageUnavailableError(); },
  async getMetadata() { throw new DocumentStorageUnavailableError(); },
};
