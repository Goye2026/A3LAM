export const AI_DOCUMENT_TYPES = ["pdf", "docx", "txt"] as const;
export type AiDocumentType = (typeof AI_DOCUMENT_TYPES)[number];

export type AiDocumentSource = "document" | "user" | "editor" | "external-source" | "ai-inferred";
export type ConfidenceClassification = "high" | "medium" | "low" | "unknown";
export type FactClassification = "EXTRACTED" | "USER_PROVIDED" | "EDITOR_VERIFIED" | "AI_INFERRED" | "NEEDS_VERIFICATION";
export type AiOutputType = "PROFILE" | "CV" | "PROFESSIONAL_BIO" | "A3LAM_PERSON_PAGE" | "DATA_EXTRACTION" | "PROFILE_IMPROVEMENT" | "SEO_ENHANCEMENT";
export type AiProviderState = "CONFIGURED" | "REQUIRES_CONFIGURATION" | "INVALID_CONFIGURATION";
export type DocumentProcessingState = "AVAILABLE" | "REQUIRES_CONFIGURATION" | "NOT_AVAILABLE";
export type AiDraftStatus = "DRAFT" | "REVIEW" | "PUBLISHED";

export const AI_DOCUMENT_STATUSES = ["UPLOADED", "VALIDATING", "EXTRACTING", "EXTRACTED", "NORMALIZING", "READY_FOR_REVIEW", "REVIEW_IN_PROGRESS", "APPROVED", "READY_FOR_GENERATION", "REJECTED", "EXTRACTION_FAILED", "PROCESSING_FAILED", "REVIEW_REJECTED", "ARCHIVED"] as const;
export type AiDocumentStatus = (typeof AI_DOCUMENT_STATUSES)[number];
export const AI_PROCESSING_JOB_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"] as const;
export type AiProcessingJobStatus = (typeof AI_PROCESSING_JOB_STATUSES)[number];
export const AI_EXTRACTION_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "SUCCEEDED", "FAILED", "UNAVAILABLE"] as const;
export type AiExtractionStatus = (typeof AI_EXTRACTION_STATUSES)[number];
export const AI_REVIEW_DECISIONS = ["UNREVIEWED", "ACCEPTED", "EDITED", "REJECTED"] as const;
export type AiReviewDecision = (typeof AI_REVIEW_DECISIONS)[number];
export const AI_OWNER_TYPES = ["ADMIN_IDENTITY", "USER"] as const;
export type AiOwnerType = (typeof AI_OWNER_TYPES)[number];
export const AI_FAILURE_CODES = ["VALIDATION_FAILED", "UNSUPPORTED_FORMAT", "MALFORMED_DOCUMENT", "EXTRACTION_UNAVAILABLE", "EXTRACTION_FAILED", "PROCESSING_FAILED", "REVIEW_REJECTED"] as const;
export type AiFailureCode = (typeof AI_FAILURE_CODES)[number];
export type AiQueueProviderState = "AVAILABLE" | "REQUIRES_CONFIGURATION";
export type AiRetentionPolicyState = "AVAILABLE" | "REQUIRES_CONFIGURATION";

export type AiDocumentRecord = {
  id: string;
  originalFilename: string;
  normalizedFilename: string;
  documentType: AiDocumentType;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  ingestionStatus: AiDocumentStatus;
  extractionStatus: AiExtractionStatus;
  processingStatus: AiProcessingJobStatus;
  ownerType: AiOwnerType;
  ownerId: string;
  storageKey: string | null;
  retentionPolicy: AiRetentionPolicyState;
  failureCode: AiFailureCode | null;
  createdAt: string;
  updatedAt: string;
};

export type AiProcessingJobRecord = {
  id: string;
  documentId: string;
  idempotencyKey: string;
  attempt: number;
  status: AiProcessingJobStatus;
  errorCode: AiFailureCode | null;
  createdAt: string;
  updatedAt: string;
};

export type AiExtractedSourceRecord = {
  id: string;
  documentId: string;
  normalizedText: string;
  extractor: string;
  extractionStatus: AiExtractionStatus;
  createdAt: string;
};

export type AiFactEvidenceRecord = {
  id: string;
  factId: string;
  page: number | null;
  section: string | null;
  excerpt: string;
  sourceUrl: string | null;
};

export type AiReviewInput = {
  decision: Exclude<AiReviewDecision, "UNREVIEWED">;
  reviewedValue?: unknown;
  reviewerNote?: string;
};

export type AiFactReviewItem = {
  id: string;
  documentId: string;
  fieldPath: string;
  value: unknown;
  confidence: ConfidenceClassification;
  classification: FactClassification;
  reviewStatus: AiReviewDecision;
  provenance: DocumentProvenance[];
};

export type AiReviewDecisionRecord = {
  id: string;
  factId: string;
  reviewerId: string;
  decision: AiReviewDecision;
  originalValue: unknown;
  reviewedValue: unknown;
  reviewerNote: string | null;
  createdAt: string;
};

export type DocumentProvenance = {
  sourceType: AiDocumentSource;
  documentId?: string;
  fileName?: string;
  page?: number;
  section?: string;
  excerpt?: string;
  sourceUrl?: string;
  actorId?: string;
};

export type StructuredFact<T = string> = {
  value: T;
  provenance: DocumentProvenance[];
  confidence: ConfidenceClassification;
  classification: FactClassification;
};

export type StructuredProfileDraft = {
  identity: {
    fullName?: StructuredFact;
    nativeName?: StructuredFact;
    latinName?: StructuredFact;
    alternateNames: StructuredFact<string>[];
    birthDate?: StructuredFact;
    birthPlace?: StructuredFact;
    deathDate?: StructuredFact;
    deathPlace?: StructuredFact;
    nationality?: StructuredFact;
  };
  professional: {
    headline?: StructuredFact;
    profession: StructuredFact<string>[];
    fields: StructuredFact<string>[];
    specialization?: StructuredFact;
    summary?: StructuredFact;
  };
  education: Array<{
    institution?: StructuredFact;
    degree?: StructuredFact;
    field?: StructuredFact;
    startYear?: StructuredFact;
    endYear?: StructuredFact;
  }>;
  career: Array<{
    organization?: StructuredFact;
    position?: StructuredFact;
    location?: StructuredFact;
    startDate?: StructuredFact;
    endDate?: StructuredFact;
    description?: StructuredFact;
  }>;
  achievements: Array<{ achievement?: StructuredFact; date?: StructuredFact; organization?: StructuredFact }>;
  awards: Array<{ award?: StructuredFact; issuer?: StructuredFact; year?: StructuredFact }>;
  publications: Array<{ title?: StructuredFact; type?: StructuredFact; year?: StructuredFact; publisher?: StructuredFact }>;
  skills: Array<{ skill?: StructuredFact; level?: StructuredFact }>;
  languages: Array<{ language?: StructuredFact; level?: StructuredFact }>;
  links: Array<{ label?: StructuredFact; url?: StructuredFact }>;
  sources: Array<{ title?: StructuredFact; url?: StructuredFact; sourceType?: StructuredFact }>;
};

export type DocumentMetadata = {
  documentType: AiDocumentType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  extractedAt: string;
  extractor: string;
};

export type DocumentExtractionResult = {
  metadata: DocumentMetadata;
  normalizedText: string;
};

export type AiReviewAction = "ACCEPT" | "EDIT" | "REJECT" | "MARK_VERIFIED" | "MARK_FOR_VERIFICATION";
export type AiReviewState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type HumanReviewFact = {
  id: string;
  fieldPath: string;
  value: unknown;
  provenance: DocumentProvenance[];
  confidence: ConfidenceClassification;
  classification: FactClassification;
  allowedActions: AiReviewAction[];
};

export type HumanReviewWorkspace = {
  state: AiReviewState;
  draftStatus: AiDraftStatus;
  facts: HumanReviewFact[];
};

export type AiProviderOperation = "extractProfile" | "improveProfile" | "generateBiography" | "generateCV" | "generateSEO";

export type AiProviderRequest = {
  operation: AiProviderOperation;
  input: StructuredProfileDraft | DocumentExtractionResult;
  outputType: AiOutputType;
};

export type AiProviderResponse = {
  outputType: AiOutputType;
  draftStatus: "DRAFT";
  generatedBy: "ai";
  profile?: StructuredProfileDraft;
  text?: string;
};

export type AiProfileProvider = {
  readonly name: string;
  readonly state: AiProviderState;
  run(request: AiProviderRequest): Promise<AiProviderResponse>;
};

export type AiAuditAction =
  | "ai.document.submitted"
  | "ai.extraction.started"
  | "ai.extraction.succeeded"
  | "ai.extraction.failed"
  | "ai.generation.requested"
  | "ai.generation.completed"
  | "ai.human_review.started"
  | "ai.fact.verified"
  | "ai.fact.rejected"
  | "ai.draft.created"
  | "ai.publication.approved";

export type AiAuditEvent = {
  action: AiAuditAction;
  actorType: "admin" | "user" | "system" | "ai";
  actorId?: string | null;
  entityType: "ai_document" | "ai_extraction" | "ai_fact" | "ai_draft" | "person" | "profile";
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
};

export type AiWorkspaceSnapshot = {
  provider: AiProviderState;
  documentProcessing: DocumentProcessingState;
  storage: "AVAILABLE" | "REQUIRES_CONFIGURATION";
  persistence: "NOT_INITIALIZED" | "REQUIRES_MIGRATION" | "AVAILABLE";
  queue: AiQueueProviderState;
  malwareScanning: "AVAILABLE" | "REQUIRES_CONFIGURATION";
  retentionPolicy: AiRetentionPolicyState;
  counts: null | {
    documents: number;
    processing: number;
    completed: number;
    failed: number;
    reviewRequired: number;
  };
};
