import { createStructuredFact } from "../facts";
import type { DocumentExtractionResult, DocumentProvenance, StructuredFact } from "../types";

export type CandidateFact = {
  fieldPath: string;
  fact: StructuredFact<string>;
  evidence: { excerpt: string; section?: string };
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu;
const URL_RE = /https?:\/\/[\w.-]+(?:\/[^\s<]*)?/giu;
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/gu;

type CandidateContext = Pick<DocumentExtractionResult, "normalizedText" | "sections" | "checksumSha256" | "metadata">;

function sectionAt(result: CandidateContext, offset: number) {
  const section = result.sections.find((candidate, index) => offset >= candidate.startOffset && offset < (result.sections[index + 1]?.startOffset ?? result.normalizedText.length));
  return section?.type;
}

function provenanceFor(result: CandidateContext, startOffset: number, endOffset: number, excerpt: string): DocumentProvenance {
  return {
    sourceType: "document",
    documentId: result.checksumSha256,
    fileName: result.metadata.originalName,
    section: sectionAt(result, startOffset),
    excerpt: excerpt.slice(0, 500),
    startOffset,
    endOffset,
  };
}

function collect(result: CandidateContext, pattern: RegExp, fieldPath: string, transform = (value: string) => value) {
  const facts: CandidateFact[] = [];
  for (const match of result.normalizedText.matchAll(pattern)) {
    const raw = match[0];
    const startOffset = match.index ?? 0;
    const endOffset = startOffset + raw.length;
    const value = transform(raw.trim());
    const provenance = provenanceFor(result, startOffset, endOffset, raw);
    facts.push({
      fieldPath,
      fact: createStructuredFact(value, [provenance], "high", "NEEDS_VERIFICATION"),
      evidence: { excerpt: raw.trim(), section: provenance.section },
    });
  }
  return facts;
}

export function extractCandidateFacts(result: CandidateContext): CandidateFact[] {
  return [
    ...collect(result, EMAIL_RE, "contact.email"),
    ...collect(result, URL_RE, "contact.website"),
    ...collect(result, PHONE_RE, "contact.phone", (value) => value.replace(/[\s().-]+/g, " ").trim()),
  ];
}
