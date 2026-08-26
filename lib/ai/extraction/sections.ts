import type { AiSectionType, ConfidenceClassification, DetectedSection, ExtractionBoundary } from "../types";

const HEADING_MAP: Array<{ type: AiSectionType; patterns: RegExp[] }> = [
  { type: "PERSONAL_INFORMATION", patterns: [/^personal information$/iu, /^معلومات(?: شخصية|الشخصية)$/u, /^بيانات(?: شخصية|الشخصية)$/u] },
  { type: "SUMMARY", patterns: [/^(professional )?summary$/iu, /^profile$/iu, /^نبذة(?: مختصرة)?$/u, /^ملخص(?: مهني)?$/u, /^الملف المهني$/u] },
  { type: "EDUCATION", patterns: [/^education$/iu, /^تعليم$/u, /^التعليم$/u, /^المؤهلات(?: العلمية)?$/u] },
  { type: "EXPERIENCE", patterns: [/^(work )?experience$/iu, /^الخبرة(?: العملية)?$/u, /^الخبرات(?: العملية)?$/u] },
  { type: "EMPLOYMENT", patterns: [/^employment$/iu, /^التوظيف$/u, /^العمل$/u] },
  { type: "POSITIONS", patterns: [/^positions?$/iu, /^المناصب?$/u, /^المواقع الوظيفية$/u] },
  { type: "ACHIEVEMENTS", patterns: [/^achievements?$/iu, /^الإنجازات?$/u, /^المنجزات?$/u] },
  { type: "AWARDS", patterns: [/^awards?$/iu, /^الجوائز?$/u, /^التكريمات?$/u] },
  { type: "PUBLICATIONS", patterns: [/^publications?$/iu, /^المنشورات?$/u, /^المؤلفات?$/u, /^الأبحاث والمنشورات$/u] },
  { type: "SKILLS", patterns: [/^skills?$/iu, /^المهارات?$/u] },
  { type: "LANGUAGES", patterns: [/^languages?$/iu, /^اللغات?$/u] },
  { type: "PROJECTS", patterns: [/^projects?$/iu, /^المشاريع?$/u] },
  { type: "CERTIFICATIONS", patterns: [/^certifications?$/iu, /^الشهادات?$/u, /^الاعتمادات?$/u] },
  { type: "CONTACT", patterns: [/^contact(?: information)?$/iu, /^بيانات التواصل$/u, /^التواصل$/u, /^اتصل بي$/u] },
];

function sectionTypeForHeading(heading: string) {
  const normalized = heading.replace(/^[-#*\d.\s]+/u, "").replace(/[:：]$/u, "").trim();
  const match = HEADING_MAP.find((candidate) => candidate.patterns.some((pattern) => pattern.test(normalized)));
  return match?.type ?? "UNKNOWN";
}

function confidenceForHeading(type: AiSectionType, heading: string): ConfidenceClassification {
  if (type === "UNKNOWN") return "low";
  const isShort = heading.trim().length <= 48;
  return isShort ? "medium" : "low";
}

export function detectSections(normalizedText: string): DetectedSection[] {
  const lines = normalizedText.split("\n");
  const sections: DetectedSection[] = [];
  let offset = 0;
  for (const line of lines) {
    const heading = line.trim();
    const type = sectionTypeForHeading(heading);
    const likelyHeading = type !== "UNKNOWN" || /^(?:#{1,6}|[-*])\s*\S.{0,60}$/u.test(heading);
    if (likelyHeading && heading) {
      sections.push({ type, heading, confidence: confidenceForHeading(type, heading), startOffset: offset, endOffset: offset + line.length });
    }
    offset += line.length + 1;
  }
  return sections;
}

export function createParagraphBoundaries(normalizedText: string): ExtractionBoundary[] {
  const boundaries: ExtractionBoundary[] = [];
  let cursor = 0;
  normalizedText.split(/\n{2,}/u).forEach((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return;
    const startOffset = normalizedText.indexOf(trimmed, cursor);
    const safeStart = startOffset >= 0 ? startOffset : cursor;
    boundaries.push({ kind: "paragraph", index, startOffset: safeStart, endOffset: safeStart + trimmed.length });
    cursor = safeStart + trimmed.length;
  });
  return boundaries;
}

export function createSectionBoundaries(sections: DetectedSection[], textLength: number): ExtractionBoundary[] {
  return sections.map((section, index) => ({
    kind: "section",
    index,
    startOffset: section.startOffset,
    endOffset: sections[index + 1]?.startOffset ?? textLength,
    section: section.type,
    heading: section.heading,
  }));
}
