import type { AiDocumentType } from "./types";

export type DocumentStorageState = "AVAILABLE" | "REQUIRES_CONFIGURATION";
export const AI_DOCUMENT_STORAGE_LIFECYCLE = ["UPLOADING", "UPLOADED", "SCANNING", "CLEAN", "REJECTED", "PROCESSING", "PROCESSED", "DELETED"] as const;
export type AiDocumentStorageLifecycle = (typeof AI_DOCUMENT_STORAGE_LIFECYCLE)[number];

export type DocumentStorageMetadata = {
  key: string;
  documentType: AiDocumentType;
  mimeType: string;
  sizeBytes: number;
};

export type SignedDocumentRetrieval = {
  url: string;
  expiresAt: string;
  privateOnly: true;
};

export type DocumentStorageReadiness = {
  state: DocumentStorageState;
  privateByDefault: true;
  publicIndexable: false;
  publicSearchable: false;
  publicSitemapVisible: false;
  signedRetrieval: "AVAILABLE" | "REQUIRES_CONFIGURATION";
  productionProvisioned: false;
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
  createSignedRetrieval?(key: string, expiresInSeconds: number): Promise<SignedDocumentRetrieval>;
};

export function getDocumentStorageState(): DocumentStorageState { return "REQUIRES_CONFIGURATION"; }

export function getDocumentStorageReadiness(): DocumentStorageReadiness {
  return {
    state: getDocumentStorageState(),
    privateByDefault: true,
    publicIndexable: false,
    publicSearchable: false,
    publicSitemapVisible: false,
    signedRetrieval: "REQUIRES_CONFIGURATION",
    productionProvisioned: false,
  };
}

export const unavailableDocumentStorage: DocumentStorage = {
  state: "REQUIRES_CONFIGURATION",
  async put() { throw new DocumentStorageUnavailableError(); },
  async get() { throw new DocumentStorageUnavailableError(); },
  async delete() { throw new DocumentStorageUnavailableError(); },
  async exists() { throw new DocumentStorageUnavailableError(); },
  async getMetadata() { throw new DocumentStorageUnavailableError(); },
  async createSignedRetrieval() { throw new DocumentStorageUnavailableError(); },
};
