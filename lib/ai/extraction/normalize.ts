import type { ExtractionLanguage } from "../types";
import { assertExtractedText, normalizeExtractedText } from "../validation";

const ARABIC_RE = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const LATIN_RE = /[A-Za-z]/u;

export function normalizeExtractionText(raw: string) {
  return assertExtractedText(raw);
}

export function splitParagraphs(normalizedText: string) {
  return normalizedText
    .split(/\n{2,}/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function detectExtractionLanguage(value: string): ExtractionLanguage {
  const hasArabic = ARABIC_RE.test(value);
  const hasLatin = LATIN_RE.test(value);
  if (hasArabic && hasLatin) return "mixed";
  if (hasArabic) return "ar";
  if (hasLatin) return "en";
  return value.trim() ? "unknown" : "unknown";
}

export function normalizeAndDetectLanguage(raw: string) {
  const normalizedText = normalizeExtractedText(raw);
  return { normalizedText, language: detectExtractionLanguage(normalizedText) };
}
