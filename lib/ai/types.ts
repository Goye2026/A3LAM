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

export const AI_PROVIDER_STATUSES = ["NOT_CONFIGURED", "READY", "DEGRADED", "RATE_LIMITED", "ERROR", "DISABLED"] as const;
export type AiProviderStatus = (typeof AI_PROVIDER_STATUSES)[number];
export const AI_GENERATION_MODES = ["PROFESSIONAL_CV", "PROFESSIONAL_PROFILE", "A3LAM_PERSON_DRAFT", "BIOGRAPHY", "SEO_DRAFT"] as const;
export type AiGenerationMode = (typeof AI_GENERATION_MODES)[number];
export const AI_GENERATION_LANGUAGES = ["ARABIC", "ENGLISH", "BILINGUAL", "SOURCE_LANGUAGE"] as const;
export type AiGenerationLanguage = (typeof AI_GENERATION_LANGUAGES)[number];
export const AI_GENERATION_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED", "REQUIRES_CONFIGURATION"] as const;
export type AiGenerationStatus = (typeof AI_GENERATION_STATUSES)[number];
export const AI_QUALITY_GATE_STATUSES = ["PENDING", "PASS", "PASS_WITH_REVIEW", "REJECTED"] as const;
export type AiQualityGateStatus = (typeof AI_QUALITY_GATE_STATUSES)[number];
export const AI_CLAIM_STATUSES = ["VERIFIED", "NEEDS_VERIFICATION", "INFERRED", "MISSING", "CONFLICTED", "REJECTED"] as const;
export type AiClaimStatus = (typeof AI_CLAIM_STATUSES)[number];
export const AI_REVIEW_DECISION_ACTIONS = ["ACCEPT", "EDIT", "REJECT", "REQUEST_SOURCE"] as const;
export type AiReviewDecisionAction = (typeof AI_REVIEW_DECISION_ACTIONS)[number];
export const AI_GENERATION_ERROR_CODES = ["PROVIDER_NOT_CONFIGURED", "PROVIDER_TIMEOUT", "PROVIDER_RATE_LIMITED", "PROVIDER_UNAVAILABLE", "INVALID_OUTPUT", "VALIDATION_FAILED", "SOURCE_CONFLICT", "REVIEW_REQUIRED", "PRIVACY_BLOCKED", "PAYLOAD_TOO_LARGE", "UNSUPPORTED_LANGUAGE"] as const;
export type AiGenerationErrorCode = (typeof AI_GENERATION_ERROR_CODES)[number];

export type AiProviderCapabilities = {
  structuredOutput: boolean;
  maxInputBytes: number;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type AiGenerationSourceFact = {
  id: string;
  fieldPath: string;
  value: unknown;
  evidenceIds: string[];
  provenance: DocumentProvenance[];
  confidence: ConfidenceClassification;
  classification: FactClassification;
};

export type AiGenerationInput = {
  documentId: string;
  facts: AiGenerationSourceFact[];
  normalizedText?: string;
  sourceLanguage: ExtractionLanguage;
};

export type AiGeneratedClaim = {
  id: string;
  fieldPath: string;
  value: unknown;
  sourceFactIds: string[];
  evidenceIds: string[];
  confidence: ConfidenceClassification;
  classification: FactClassification;
  status: AiClaimStatus;
  provenance: DocumentProvenance[];
};

export type AiGeneratedProfileDraft = {
  mode: AiGenerationMode;
  outputLanguage: AiGenerationLanguage;
  identity: StructuredProfileDraft["identity"];
  headline?: StructuredFact;
  shortBio?: StructuredFact;
  longBio?: StructuredFact;
  education: StructuredProfileDraft["education"];
  experience: StructuredProfileDraft["career"];
  positions: StructuredProfileDraft["career"];
  achievements: StructuredProfileDraft["achievements"];
  skills: StructuredProfileDraft["skills"];
  languages: StructuredProfileDraft["languages"];
  locations: StructuredFact<string>[];
  organizations: StructuredFact<string>[];
  publications: StructuredProfileDraft["publications"];
  awards: StructuredProfileDraft["awards"];
  webLinks: StructuredProfileDraft["links"];
  sources: StructuredProfileDraft["sources"];
  claims: AiGeneratedClaim[];
};

export type AiPromptMessage = { role: "system" | "user"; content: string };

export type AiGenerationPrompt = {
  messages: AiPromptMessage[];
  digest: string;
  containsInstructionLikeText: boolean;
};

export type AiGenerationRequest = {
  jobId: string;
  mode: AiGenerationMode;
  outputLanguage: AiGenerationLanguage;
  input: AiGenerationInput;
  prompt: AiGenerationPrompt;
};

export type AiGenerationResult = {
  status: AiGenerationStatus;
  draftStatus: "DRAFT";
  mode: AiGenerationMode;
  outputLanguage: AiGenerationLanguage;
  providerId: string;
  modelId: string;
  draft?: AiGeneratedProfileDraft;
  claims: AiGeneratedClaim[];
  qualityGate: AiQualityGateStatus;
  errorCode?: AiGenerationErrorCode;
  errorMessage?: string;
};

export type AiGenerationJobRecord = {
  id: string;
  documentId: string;
  idempotencyKey: string;
  mode: AiGenerationMode;
  outputLanguage: AiGenerationLanguage;
  status: AiGenerationStatus;
  providerId: string | null;
  modelId: string | null;
  attempt: number;
  qualityGate: AiQualityGateStatus;
  errorCode: AiGenerationErrorCode | null;
  createdAt: string;
  updatedAt: string;
};

export type AiGenerationAttemptRecord = {
  id: string;
  jobId: string;
  attempt: number;
  status: AiGenerationStatus;
  errorCode: AiGenerationErrorCode | null;
  createdAt: string;
};

export type AiGenerationReviewInput = {
  action: AiReviewDecisionAction;
  reviewedValue?: unknown;
  reviewerNote?: string;
};

export type AiProvider = {
  readonly id: string;
  readonly modelId: string;
  readonly status: AiProviderStatus;
  readonly capabilities: AiProviderCapabilities;
  generate(request: AiGenerationRequest): Promise<AiGenerationResult>;
};

export const AI_EXTRACTION_ERROR_CODES = [
  "UNSUPPORTED_TYPE", "INVALID_FILE", "EMPTY_DOCUMENT", "FILE_TOO_LARGE", "EXTRACTED_TEXT_TOO_LARGE",
  "PDF_TEXT_UNAVAILABLE", "OCR_REQUIRED", "DOCX_INVALID", "DOCX_UNSAFE_ARCHIVE", "PARSER_FAILURE",
  "NORMALIZATION_FAILURE", "TIMEOUT", "RESOURCE_LIMIT", "UNAVAILABLE", "MALFORMED_DOCUMENT",
] as const;
export type AiExtractionErrorCode = (typeof AI_EXTRACTION_ERROR_CODES)[number];
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
  startOffset?: number;
  endOffset?: number;
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

export const AI_EXTRACTION_RESULT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "PARTIAL", "FAILED", "UNAVAILABLE", "REJECTED"] as const;
export type AiExtractionResultStatus = (typeof AI_EXTRACTION_RESULT_STATUSES)[number];

export type ExtractionLanguage = "ar" | "en" | "mixed" | "unknown";

export const AI_SECTION_TYPES = [
  "PERSONAL_INFORMATION", "SUMMARY", "EDUCATION", "EXPERIENCE", "EMPLOYMENT", "POSITIONS",
  "ACHIEVEMENTS", "AWARDS", "PUBLICATIONS", "SKILLS", "LANGUAGES", "PROJECTS", "CERTIFICATIONS",
  "CONTACT", "UNKNOWN",
] as const;
export type AiSectionType = (typeof AI_SECTION_TYPES)[number];

export type ExtractionBoundary = {
  kind: "page" | "paragraph" | "section";
  index: number;
  startOffset: number;
  endOffset: number;
  page?: number;
  section?: AiSectionType;
  heading?: string;
};

export type ExtractionWarning = {
  code: string;
  message: string;
  location?: "document" | "page" | "paragraph" | "section";
  page?: number;
};

export type DetectedSection = {
  type: AiSectionType;
  heading: string;
  confidence: ConfidenceClassification;
  startOffset: number;
  endOffset: number;
};

export type DocumentExtractionInput = {
  metadata: DocumentMetadata;
  normalizedText: string;
};

export type ExtractionCandidateFact = {
  fieldPath: string;
  value: unknown;
  confidence: ConfidenceClassification;
  classification: FactClassification;
  provenance: DocumentProvenance[];
  evidence: { excerpt: string; section?: string };
};

export type DocumentExtractionResult = DocumentExtractionInput & {
  status: AiExtractionResultStatus;
  characterCount: number;
  pageCount: number | null;
  boundaries: ExtractionBoundary[];
  warnings: ExtractionWarning[];
  language: ExtractionLanguage;
  sections: DetectedSection[];
  parserVersion: string;
  extractionVersion: string;
  checksumSha256: string;
  provenance: DocumentProvenance;
  candidateFacts: ExtractionCandidateFact[];
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
  input: StructuredProfileDraft | DocumentExtractionResult | DocumentExtractionInput;
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
  | "ai.generation.failed"
  | "ai.human_review.started"
  | "ai.human_review.requested"
  | "ai.review.accepted"
  | "ai.review.edited"
  | "ai.review.rejected"
  | "ai.review.requested"
  | "ai.fact.verified"
  | "ai.fact.rejected"
  | "ai.draft.created"
  | "ai.publication.approved";

export type AiAuditEvent = {
  action: AiAuditAction;
  actorType: "admin" | "user" | "system" | "ai";
  actorId?: string | null;
  entityType: "ai_document" | "ai_extraction" | "ai_fact" | "ai_draft" | "ai_generation_job" | "ai_generation_claim" | "person" | "profile";
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
};

export type AiWorkspaceSnapshot = {
  activation: "DISABLED" | "ENABLED";
  provider: AiProviderState;
  generationProvider: AiProviderStatus;
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
