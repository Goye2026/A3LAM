import { AI_CLAIM_STATUSES, AI_GENERATION_LANGUAGES, AI_GENERATION_MODES, AI_GENERATION_STATUSES, AI_QUALITY_GATE_STATUSES } from "../types";

const fact = {
  type: "object",
  additionalProperties: false,
  properties: {
    value: {},
    confidence: { type: "string", enum: ["high", "medium", "low", "unknown"] },
    classification: { type: "string", enum: ["EXTRACTED", "USER_PROVIDED", "EDITOR_VERIFIED", "AI_INFERRED", "NEEDS_VERIFICATION"] },
    provenance: { type: "array", items: { type: "object" }, maxItems: 100 },
  },
  required: ["value", "confidence", "classification", "provenance"],
} as const;

const record = (keys: readonly string[]) => ({
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(keys.map((key) => [key, fact])),
  required: [],
});
const list = (keys: readonly string[]) => ({ type: "array", items: record(keys), maxItems: 500 });

export const AI_GENERATED_PROFILE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    mode: { type: "string", enum: [...AI_GENERATION_MODES] },
    outputLanguage: { type: "string", enum: [...AI_GENERATION_LANGUAGES] },
    identity: record(["fullName", "nativeName", "latinName", "alternateNames", "birthDate", "birthPlace", "deathDate", "deathPlace", "nationality"]),
    headline: fact,
    shortBio: fact,
    longBio: fact,
    education: list(["institution", "degree", "field", "startYear", "endYear"]),
    experience: list(["organization", "position", "location", "startDate", "endDate", "description"]),
    positions: list(["organization", "position", "location", "startDate", "endDate", "description"]),
    achievements: list(["achievement", "date", "organization"]),
    skills: list(["skill", "level"]),
    languages: list(["language", "level"]),
    locations: { type: "array", items: fact, maxItems: 500 },
    organizations: { type: "array", items: fact, maxItems: 500 },
    publications: list(["title", "type", "year", "publisher"]),
    awards: list(["award", "issuer", "year"]),
    webLinks: list(["label", "url"]),
    sources: list(["title", "url", "sourceType"]),
    claims: {
      type: "array",
      maxItems: 500,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", minLength: 1 },
          fieldPath: { type: "string", minLength: 1 },
          value: {},
          sourceFactIds: { type: "array", items: { type: "string" }, maxItems: 100 },
          evidenceIds: { type: "array", items: { type: "string" }, maxItems: 100 },
          confidence: { type: "string", enum: ["high", "medium", "low", "unknown"] },
          classification: { type: "string", enum: ["EXTRACTED", "USER_PROVIDED", "EDITOR_VERIFIED", "AI_INFERRED", "NEEDS_VERIFICATION"] },
          status: { type: "string", enum: [...AI_CLAIM_STATUSES] },
          provenance: { type: "array", items: { type: "object" }, maxItems: 100 },
        },
        required: ["id", "fieldPath", "value", "sourceFactIds", "evidenceIds", "confidence", "classification", "status", "provenance"],
      },
    },
    status: { type: "string", enum: [...AI_GENERATION_STATUSES] },
    qualityGate: { type: "string", enum: [...AI_QUALITY_GATE_STATUSES] },
  },
  required: ["mode", "outputLanguage", "identity", "education", "experience", "positions", "achievements", "skills", "languages", "locations", "organizations", "publications", "awards", "webLinks", "sources", "claims"],
} as const;
